# Kubernetes

To test the application deployment, run the full application (PostgreSQL, backend, and frontend) in a local Kubernetes cluster. There are two environments, each in its own cluster:

- **dev:** Images built from the local code.
- **prod:** The published images from GHCR.

The clusters run on [k3d](https://k3d.io/) (k3s in Docker). The [CloudNativePG](https://cloudnative-pg.io/) operator manages the database. [Kustomize](https://kustomize.io/) combines the manifests.

---

## File structure

[Kustomize](https://kustomize.io/) is built into `kubectl`, for example `kubectl apply -k`. It combines plain Kubernetes YAML files, without templates. A **base** has the manifests that every environment shares. An **overlay** only changes what's different for one environment.

Here, `base/` is shared by dev and prod. `overlays/dev/` and `overlays/prod/` change things like the images and the namespace.

```
kubernetes/
├── k3d-config-dev.yaml          # The dev cluster: 1 server, ports 22111/22112, no Traefik
├── k3d-config-prod.yaml         # The prod cluster: 1 server, ports 23111/23112, no Traefik
├── scripts/cluster-setup.sh     # Creates a cluster and deploys the application
├── base/                        # What every environment has in common
│   ├── backend/
│   │   ├── kustomization.yaml
│   │   ├── database.yaml        # CNPG Cluster "todo-database-v1" (PostgreSQL)
│   │   ├── configmap.yaml       # DB_URL for the backend
│   │   ├── secret.yaml          # Database user and password (placeholders)
│   │   ├── deployment.yaml      # Backend, with readiness and liveness probes
│   │   └── service.yaml         # LoadBalancer on port 22111
│   └── frontend/
│       ├── kustomization.yaml
│       ├── deployment.yaml      # Frontend (Nginx)
│       └── service.yaml         # LoadBalancer on port 22112 → container port 80
└── overlays/
    ├── dev/                     # Namespace "dev-todo"
    │   ├── kustomization.yaml   # Namespace + backend + frontend
    │   ├── namespace.yaml
    │   ├── backend/             # Local image, 1 database instance, credentials
    │   └── frontend/            # Local image
    └── prod/                    # Namespace "prod-todo"
        ├── kustomization.yaml   # Namespace + backend + frontend
        ├── namespace.yaml
        ├── backend/             # Image "latest" from GHCR, 1 database instance, credentials
        └── frontend/            # Image "latest" from GHCR
```

---

## Run it locally

The script `scripts/cluster-setup.sh` asks for the environment, creates the cluster for it, and deploys the application.

You need Docker, `k3d`, and `kubectl`. The devcontainer has them, with the versions from `mise.toml`. It also includes `k9s`, a terminal UI for exploring the cluster.

**Run the script from the project root**

```bash
./kubernetes/scripts/cluster-setup.sh
```

The two environments:

| Setting   | `dev`                                 | `prod`                                               |
|-----------|---------------------------------------|------------------------------------------------------|
| Cluster   | `dev-todo-cluster`                    | `prod-todo-cluster`                                  |
| Config    | `k3d-config-dev.yaml`                 | `k3d-config-prod.yaml`                               |
| Namespace | `dev-todo`                            | `prod-todo`                                          |
| Images    | `backend:dev`, `frontend:dev` (local) | `todo-backend:latest`, `todo-frontend:latest` (GHCR) |
| Frontend  | <http://localhost:22112>              | <http://localhost:23112>                             |
| API       | <http://localhost:22111/api/todos>    | <http://localhost:23111/api/todos>                   |
| Health    | <http://localhost:22111/health>       | <http://localhost:23111/health>                      |

The script:

1. Checks that `k3d`, `kubectl`, and `docker` are installed.
2. Asks for `dev` or `prod`. `dev` is the default.
3. Creates the cluster from its config file. If it already exists, it asks whether to delete and recreate it.
4. On a new cluster, installs the CloudNativePG operator (version in `CNPG_VERSION` at the top of the script).
5. Switches `kubectl` to the cluster, and waits until the operator runs. Without the operator, the database `Cluster` can't be created.
6. **`dev`:** Builds the images `backend:dev` and `frontend:dev` from the local code, and imports them into the cluster. `prod` skips this step.
7. Deploys the overlay with `kubectl apply -k kubernetes/overlays/<dev or prod>`. For `prod`, Kubernetes pulls the `latest` images from GHCR when the pods start.
8. Waits until the backend and frontend pods are ready, and prints the URLs.

> **Note**: The dev cluster uses the same ports as `quarkus:dev` and `npm run dev`. Stop dev mode before starting the dev cluster. Stop the dev cluster (`k3d cluster stop dev-todo-cluster`) before starting dev mode. The prod cluster uses other ports and can run next to both.

---

## Base and overlays

The base is meant for every environment. The overlays only change what's specific to each environment:

| Setting                    | Base                                 | Dev overlay                          | Prod overlay                          |
|----------------------------|--------------------------------------|--------------------------------------|---------------------------------------|
| Namespace                  | (none)                               | `dev-todo`                           | `prod-todo`                           |
| Backend image              | `ghcr.io/hansth/todo-backend:0.3.0`  | `backend:dev` (built by the script)  | `ghcr.io/hansth/todo-backend:latest`  |
| Frontend image             | `ghcr.io/hansth/todo-frontend:0.3.0` | `frontend:dev` (built by the script) | `ghcr.io/hansth/todo-frontend:latest` |
| `imagePullPolicy`          | `IfNotPresent`                       | `Never` (use the imported image)     | `Always`                              |
| Database instances         | 3                                    | 1                                    | 1                                     |
| Database user and password | Placeholders                         | `todo` / `password`                  | `todo` / `password`                   |

- **Base images:** The images the release pipeline publishes to GitHub's container registry, pinned to a version. See the tags in the [GitHub repository](https://github.com/hansth/k8s-gitops/tags).
- **`Never` in dev:** A missing image fails right away with `ErrImageNeverPull`. Kubernetes doesn't try to download `backend:dev` from Docker Hub.
- **`latest` in prod:** Keeps the script simple. Prod always runs the newest release, without a version to update after every release. `Always` makes Kubernetes check GHCR for a newer `latest` each time a pod starts.
- **`op: add` for `imagePullPolicy` in dev:** The dev overlay adds the field instead of replacing it. It also works when the base has no `imagePullPolicy` line. The prod overlay uses `op: replace`, and needs that line in the base.

> **Note**: With `latest`, Git doesn't show which version runs in prod. For GitOps, an overlay pins a version tag like `0.3.2` and raises it with a pull request.

---

## Database

PostgreSQL runs inside the cluster, managed by the CloudNativePG operator. The `Cluster` resource describes the database, and the operator creates and runs it.

- **`database.yaml`:** A CloudNativePG `Cluster` with the database `todos`. The operator creates the PostgreSQL pods, the volumes, and the Services. The backend connects to the read-write Service `todo-database-v1-rw`.
- **`configmap.yaml`:** `DB_URL` uses the short Service name (`todo-database-v1-rw:5432`). It works in every namespace.
- **`secret.yaml`:** The Secret `todo-db-creds` has type `kubernetes.io/basic-auth`, which CloudNativePG expects for the `initdb` user. The backend reads `username` and `password` from it as `DB_USERNAME` and `DB_PASSWORD`.
- **Credentials in the overlays:** Both overlays replace the Secret's `data` with `stringData` (plain text). They copy the username into the database `owner` with `replacements`. The username is written only once per overlay.

The pods start in order with init containers:

1. The backend waits until the database port (`todo-database-v1-rw:5432`) is open. The backend runs the Flyway migrations at startup and doesn't start without a database.
2. The frontend waits until the backend port (`backend:22111`) is open.

> **Note**: The dev and prod passwords are in Git. That's fine for local clusters only. For a real environment, use something like SOPS with age or External Secrets.

---

## Health checks

The backend has two probes, both from Quarkus SmallRye Health:

| Probe     | Path            | Meaning                                                                              |
|-----------|-----------------|--------------------------------------------------------------------------------------|
| Readiness | `/health/ready` | Quarkus runs and the database is reachable. Only then does the Service send traffic. |
| Liveness  | `/health/live`  | The application itself runs. A database outage doesn't restart the pod.              |

`/health` shows both together, for a quick look in a browser.

---

## Useful commands

The commands use the `dev-todo` namespace. For prod, replace `dev-todo` with `prod-todo`.

| Command                                           | What it does                                   |
|---------------------------------------------------|------------------------------------------------|
| `kubectl get pods -n dev-todo`                    | Show the status of all pods                    |
| `kubectl logs deploy/backend -n dev-todo -f`      | Follow the backend log                         |
| `kubectl describe pod -l app=backend -n dev-todo` | Show events, probes, and image problems        |
| `kubectl get cluster -n dev-todo`                 | Show the status of the CNPG database           |
| `k9s -n dev-todo`                                 | Open a terminal UI for the cluster             |
| `kubectl kustomize kubernetes/overlays/dev`       | Show what would be deployed, without deploying |

### Deploy a code change to dev

Rebuild the image, import it, and restart the deployment. The example is for the backend. For the frontend, replace `backend` with `frontend`.

**Rebuild the image from the project root**

```bash
docker build -t backend:dev -f backend/Dockerfile .
```

**Import the image into k3d**

```bash
k3d image import backend:dev -c dev-todo-cluster
```

**Restart the deployment**

```bash
kubectl rollout restart deployment/backend -n dev-todo
```

### Deploy a new release to prod

Prod pulls `latest` only when a pod starts. After a new release, restart the deployments.

**Restart the prod deployments**

```bash
kubectl rollout restart deployment/backend deployment/frontend -n prod-todo
```

> **Note**: Running `cluster-setup.sh` again and keeping the cluster doesn't restart the pods. The image names `backend:dev` and `latest` don't change, and `kubectl apply` sees nothing new. Run the `rollout restart` afterwards.

### Delete a cluster

**Delete the dev cluster**

```bash
k3d cluster delete dev-todo-cluster
```

**Delete the prod cluster**

```bash
k3d cluster delete prod-todo-cluster
```

---

## Good to know

Things that can go wrong when working with the clusters.

### A Secret's type can't be changed

A cluster from before the Secret got its type may still have `todo-db-creds` without `kubernetes.io/basic-auth`. `kubectl apply` then fails with "field is immutable". Delete the Secret once and apply again, or recreate the cluster.

**Delete the old Secret**

```bash
kubectl delete secret todo-db-creds -n dev-todo
```

### Images on GHCR

The images `todo-backend` and `todo-frontend` are public, like the repository. A cluster pulls them without login.

- **Repository:** Must stay public for the GitHub Actions setup. See the [notes](../notes/notes.md).
- **Private image:** Needs an `imagePullSecret` in the cluster.
- **Dev overlay:** Doesn't pull. It uses the local images imported into the cluster.
- **Prod overlay:** Pulls `latest` from GHCR.

### Traefik is turned off

Both k3d configs turn off Traefik, the Ingress controller that comes with k3s. The application doesn't use an Ingress. The Services are of type `LoadBalancer`. k3d exposes them on ports `22111` and `22112` for dev, and on `23111` and `23112` for prod.

---
