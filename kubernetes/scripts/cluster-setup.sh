#!/bin/bash
set -e

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
ROOT_DIR="$(git rev-parse --show-toplevel)"
SCRIPT_DIR="${ROOT_DIR}/kubernetes/scripts"
K8S_DIR="$(dirname "$SCRIPT_DIR")"
# CloudNativePG operator version:
# https://github.com/cloudnative-pg/cloudnative-pg/releases
CNPG_VERSION="1.30.1"

echo -e "${YELLOW}Kubernetes Deployment Helper${NC}"
echo -e "${YELLOW}This script will set up a k3d cluster and deploy the application.${NC}"

# Check for required tools
check_dependency() {
  if ! command -v "$1" &>/dev/null; then
    echo -e "\n${RED}Error: $1 is not installed. Please install it before proceeding.${NC}"
    exit 1
  fi
}

# Check installed dependencies
echo -e "\n${YELLOW}Checking dependencies...${NC}"
check_dependency k3d
check_dependency kubectl
check_dependency docker
echo -e "${GREEN}All dependencies are installed.${NC}"

# Choose which overlay/environment to deploy
echo -e "\n${YELLOW}Which overlay do you want to deploy?${NC}"
read -p "Enter 'dev' or 'prod' [dev]: " -r OVERLAY
OVERLAY=${OVERLAY:-dev}
while [[ "$OVERLAY" != "dev" && "$OVERLAY" != "prod" ]]; do
  read -p "Please enter 'dev' or 'prod': " -r OVERLAY
done

case "$OVERLAY" in
  dev)
    NAMESPACE="dev-todo"
    CLUSTER_NAME="dev-todo-cluster"
    K3D_CONFIG="$K8S_DIR/k3d-config-dev.yaml"
    BACKEND_IMAGE="backend:dev"
    FRONTEND_IMAGE="frontend:dev"
    BACKEND_HOST_PORT=22111
    FRONTEND_HOST_PORT=22112
    ;;
  prod)
    NAMESPACE="prod-todo"
    CLUSTER_NAME="prod-todo-cluster"
    K3D_CONFIG="$K8S_DIR/k3d-config-prod.yaml"
    BACKEND_HOST_PORT=23111
    FRONTEND_HOST_PORT=23112
    ;;
esac
echo -e "${GREEN}Deploying the '${OVERLAY}' overlay into namespace '${NAMESPACE}'.${NC}"

# Check if cluster exists
if k3d cluster list | grep -qE "^${CLUSTER_NAME}[[:space:]]"; then

  echo -e "\n${YELLOW}Cluster $CLUSTER_NAME already exists.${NC}"
  read -p "Do you want to delete and recreate it? (y/n): " -r

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deleting existing cluster...${NC}"
    k3d cluster delete "$CLUSTER_NAME"
  else
    echo -e "${GREEN}Using existing cluster.${NC}"
  fi
fi

# Create cluster if it doesn't exist with CloudNativePG operator
if ! k3d cluster list | grep -qE "^${CLUSTER_NAME}[[:space:]]"; then

  echo -e "\n${YELLOW}Creating k3d cluster using config file...${NC}"
  k3d cluster create --config "$K3D_CONFIG"
  echo -e "${GREEN}Cluster created successfully!${NC}"

  echo -e "\n${YELLOW}Installing CloudNativePG operator ${CNPG_VERSION}...${NC}"
  kubectl apply --server-side -f \
    "https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-${CNPG_VERSION%.*}/releases/cnpg-${CNPG_VERSION}.yaml"
  echo -e "${GREEN}CloudNativePG operator installed.${NC}"
fi

# Wait until the CloudNativePG operator runs
echo -e "\n${YELLOW}Waiting for the CloudNativePG operator to be ready...${NC}"
kubectl rollout status deployment cnpg-controller-manager -n cnpg-system --timeout=180s
echo -e "${GREEN}CloudNativePG operator is ready.${NC}"

# Configure kubectl to use the cluster
echo -e "\n${YELLOW}Configuring kubectl to use the cluster...${NC}"
kubectl config use-context k3d-"$CLUSTER_NAME"

# Build and import local images (dev only; prod pulls versioned images from GHCR)
if [[ "$OVERLAY" == "dev" ]]; then
  echo -e "\n${YELLOW}Building Docker images...${NC}"
  echo "Building backend image..."
  docker build -t "$BACKEND_IMAGE" -f "$ROOT_DIR/backend/Dockerfile" "$ROOT_DIR"
  echo "Building frontend image..."
  docker build -t "$FRONTEND_IMAGE" -f "$ROOT_DIR/frontend/Dockerfile" "$ROOT_DIR"

  echo -e "\n${YELLOW}Importing images into ${CLUSTER_NAME}...${NC}"
  k3d image import "$BACKEND_IMAGE" -c "$CLUSTER_NAME"
  k3d image import "$FRONTEND_IMAGE" -c "$CLUSTER_NAME"
fi

# Deploy the application using kustomize
echo -e "\n${YELLOW}Deploying manifests using kustomize...${NC}"
kubectl apply -k "$K8S_DIR/overlays/$OVERLAY"

# Wait for pods to be ready
echo -e "\n${YELLOW}Waiting for pods to be ready...${NC}"
sleep 10s
kubectl wait --for=condition=Ready pods -l 'app in (backend,frontend)' -n "${NAMESPACE}" --timeout=360s
echo -e "${GREEN}Application deployed successfully!${NC}"

# Get service info
echo -e "\n${YELLOW}Getting service information...${NC}"
kubectl get services -n "${NAMESPACE}"

# Host ports, set per overlay above (k3d maps these to the loadbalancer;
# they differ from the Service's own port for prod, so not read via kubectl)
FRONTEND_PORT=$FRONTEND_HOST_PORT
BACKEND_PORT=$BACKEND_HOST_PORT

# Access the application in the browser
echo -e "\n${YELLOW}Access the application for local development:${NC}"
echo -e "Frontend: http://localhost:$FRONTEND_PORT"
echo -e "Backend API: http://localhost:$BACKEND_PORT/api/todos"
echo -e "Backend health check: http://localhost:$BACKEND_PORT/health"

# Delete the cluster manually
echo -e "\n${YELLOW}To delete the cluster when finished:${NC}"
echo -e "k3d cluster delete $CLUSTER_NAME\n"
