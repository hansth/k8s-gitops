# Kubernetes

Runs the whole application (PostgreSQL, backend and frontend) in a local Kubernetes cluster, for development. The cluster is [k3d](https://k3d.io/) (k3s in Docker), the database is managed by the [CloudNativePG](https://cloudnative-pg.io/) operator and the manifests are combined with [Kustomize](https://kustomize.io/).

---

## File structure

Kustomize uses a **base and overlay** pattern instead of templates. The `base/` directory has the manifests every environment shares. Each directory in `overlays/` patches the base for one environment. For now there is only `dev`, the local k3d cluster.

```
kubernetes/
├── k3d-config.yaml              # The k3d cluster: 1 server, ports 22111/22112
├── scripts/cluster-setup.sh     # Creates the cluster and deploys the application
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
    └── dev/                     # The local k3d environment, namespace "dev-todo"
        ├── kustomization.yaml   # Namespace + backend + frontend
        ├── namespace.yaml
        ├── backend/             # Local image, 1 database instance, dev credentials
        └── frontend/            # Local image
```

---

## Run it locally

The script `scripts/cluster-setup.sh` creates a k3d cluster, builds the backend and frontend images from the local code and deploys them.

You need Docker, `k3d` and `kubectl`. The devcontainer has them, together with `k9s` (versions in `mise.toml`).

**Run the script from the project root**
```bash
./kubernetes/scripts/cluster-setup.sh
```

The script:

1. Checks that `k3d`, `kubectl` and `docker` are installed.
2. Creates the cluster `todo-cluster` from `k3d-config.yaml`. If it already exists, it asks whether to delete and recreate it.
3. On a new cluster, installs the CloudNativePG operator (version in `CNPG_VERSION` at the top of the script). It waits until the operator runs. Without it, the database `Cluster` can't be created.
4. Builds the images `backend:dev` and `frontend:dev` from the local code, and imports them into k3d.
5. Deploys the dev overlay with `kubectl apply -k kubernetes/overlays/dev`.
6. Waits until the backend and frontend pods are ready, and prints the URLs.

Then open:

| What           | URL                                |
|----------------|------------------------------------|
| Frontend       | <http://localhost:22112>           |
| Backend API    | <http://localhost:22111/api/todos> |
| Backend health | <http://localhost:22111/health>    |

> **Note**: These are the same ports as `quarkus:dev` and `npm run dev`. Stop dev mode before starting the cluster. Stop the cluster (`k3d cluster stop todo-cluster`) before starting dev mode.

---

## Base and dev overlay

The base is meant for every environment. The dev overlay only changes what's specific to the local k3d cluster:

| Setting                    | Base                                 | Dev overlay                           |
|----------------------------|--------------------------------------|---------------------------------------|
| Namespace                  | (none)                               | `dev-todo`                            |
| Backend image              | `ghcr.io/hansth/todo-backend:0.3.0`  | `backend:dev` (built by the script)   |
| Frontend image             | `ghcr.io/hansth/todo-frontend:0.3.0` | `frontend:dev` (built by the script)  |
| `imagePullPolicy`          | `IfNotPresent`                       | `Never` (only use the imported image) |
| Database instances         | 3                                    | 1                                     |
| Database user and password | Placeholders                         | `todo` / `password`                   |

- **Base images:** The images the release pipeline publishes to GitHub's container registry. A later environment (for example staging or prod) can use them directly, or set another version.
- **`Never` in dev:** A missing image fails right away with `ErrImageNeverPull`. Kubernetes doesn't try to download `backend:dev` from Docker Hub.
- **`op: add` for `imagePullPolicy`:** The dev overlay adds the field instead of replacing it. It also works when the base has no `imagePullPolicy` line.

---

## Database

PostgreSQL runs inside the cluster, managed by the CloudNativePG operator. The `Cluster` resource describes the database, and the operator creates and runs it.

- **`database.yaml`:** A CloudNativePG `Cluster` with the database `todos`. The operator creates the PostgreSQL pods, the volumes and the Services. The backend connects to the read-write Service `todo-database-v1-rw`.
- **`configmap.yaml`:** `DB_URL` uses the short Service name (`todo-database-v1-rw:5432`). It works in every namespace.
- **`secret.yaml`:** The Secret `todo-db-creds` has type `kubernetes.io/basic-auth`, which CloudNativePG expects for the `initdb` user. The backend reads `username` and `password` from it as `DB_USERNAME` and `DB_PASSWORD`.
- **Dev credentials:** The dev overlay replaces the Secret's `data` with `stringData` (plain text). It copies the username into the database `owner` with `replacements`. The username is written only once.

The pods start in order with init containers:

1. The backend waits until the database port (`todo-database-v1-rw:5432`) is open. The backend runs the Flyway migrations at startup and doesn't start without a database.
2. The frontend waits until the backend port (`backend:22111`) is open.

> **Note**: The dev password is in Git. That's fine for a local cluster only. For a real environment, use something like Sealed Secrets or External Secrets.

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

All commands use the `dev-todo` namespace.

| Command                                           | What it does                                   |
|---------------------------------------------------|------------------------------------------------|
| `kubectl get pods -n dev-todo`                    | Show the status of all pods                    |
| `kubectl logs deploy/backend -n dev-todo -f`      | Follow the backend log                         |
| `kubectl describe pod -l app=backend -n dev-todo` | Show events, probes and image problems         |
| `kubectl get cluster -n dev-todo`                 | Show the status of the CNPG database           |
| `k9s -n dev-todo`                                 | Open a terminal UI for the cluster             |
| `kubectl kustomize kubernetes/overlays/dev`       | Show what would be deployed, without deploying |

After a code change, rebuild the image, import it and restart the deployment. The example is for the backend. For the frontend, replace `backend` with `frontend`.

**Rebuild the image from the project root**
```bash
docker build -t backend:dev -f backend/Dockerfile .
```

**Import the image into k3d**
```bash
k3d image import backend:dev -c todo-cluster
```

**Restart the deployment**
```bash
kubectl rollout restart deployment/backend -n dev-todo
```

> **Note**: Running `cluster-setup.sh` again and keeping the cluster rebuilds and imports the images, but doesn't restart the pods. The image name `backend:dev` doesn't change, and `kubectl apply` sees nothing new. Run the `rollout restart` afterwards.

**Delete the cluster**
```bash
k3d cluster delete todo-cluster
```

---

## Good to know

Things that can go wrong when working with the cluster.

### A Secret's type can't be changed

A cluster from before the Secret got its type may still have `todo-db-creds` without `kubernetes.io/basic-auth`. `kubectl apply` then fails with "field is immutable". Delete the Secret once and apply again, or recreate the cluster.

**Delete the old Secret**
```bash
kubectl delete secret todo-db-creds -n dev-todo
```

### Images on GHCR

The images `todo-backend` and `todo-frontend` are public, like the repository. A cluster pulls the base images without login.

- **Repository:** Must stay public for the GitHub Actions setup. See the [notes](../notes/notes.md).
- **Private image:** Needs an `imagePullSecret` in the cluster.
- **Dev overlay:** Doesn't pull. It uses the local images imported into the cluster.

### Traefik is turned off

`k3d-config.yaml` turns off Traefik, the Ingress controller that comes with k3s. The application doesn't use an Ingress. The Services are of type `LoadBalancer`, and k3d exposes them on ports `22111` and `22112`.
