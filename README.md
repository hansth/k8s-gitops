# K8s GitOps: From Devcontainer to Cluster

This project uses a todo application: a Quarkus backend and a React frontend on PostgreSQL. Both are built from one OpenAPI description.

The project covers the whole path around it: from a devcontainer, through GitHub Actions, to a Kubernetes cluster. A developer opens the project in a devcontainer and has all tools ready. Every pull request is tested and scanned by GitHub Actions, and every release becomes a Docker image that runs in a local Kubernetes cluster.

The deployment workflow has two local clusters. A change is first tested in the dev cluster, with images built from the local code. After the release, the published images are tested in the prod cluster. See [Development workflow](#development-workflow).

---

## Why this project

I build this project to learn three things:

- **GitOps:** Git as the single source of truth for what runs in Kubernetes. A change to the cluster starts with a commit, not with a `kubectl` command.
- **GitHub Actions:** A series of workflows that test, scan, version, and publish every part on its own, from a pull request to a release.
- **Developer experience with devcontainers:** One container with all tools and Git hooks. A new developer opens the project and can start right away, with the same setup as everyone else.

The todo application itself is kept simple on purpose. The focus is on everything around it: how the code is built, tested, released, and deployed.

> **Note**: This is a learning project and a work in progress. The GitHub Actions pipeline and the devcontainer are in place. The cluster can be deployed with a script.

---

## Parts

The project is split into parts, each in its own directory. The backend and frontend are both built from the OpenAPI description in `openapi/`. The `kubernetes/` directory runs everything together in a local cluster.

| Directory                    | What it is                                                         | Tech                                  |
|------------------------------|--------------------------------------------------------------------|---------------------------------------|
| `.devcontainer/`             | The development container with all tools installed                 | Docker, mise                          |
| `.github/workflows/`         | The pipelines that test, scan, version, and publish each part      | GitHub Actions, Trivy, Release Please |
| [`backend/`](backend/)       | The REST API, stores todos in PostgreSQL                           | Quarkus, Java 25, Hibernate, Flyway   |
| [`frontend/`](frontend/)     | The web app                                                        | React 19, TypeScript, Vite            |
| [`openapi/`](openapi/)       | The API description, and the code generated from it                | OpenAPI 3.0, openapi-generator, npm   |
| [`kubernetes/`](kubernetes/) | The manifests to run the application in a local Kubernetes cluster | k3d, Kustomize, CloudNativePG         |

The API description in `openapi/openapi.yaml` generates a Java interface for the backend and TypeScript types for the frontend. In the browser, the frontend port `22112` passes the `/api` calls on to the backend port `22111`, which stores the todos in PostgreSQL (port 5432).

Each part has its own README with the details:

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [OpenAPI README](openapi/README.md)
- [Kubernetes README](kubernetes/README.md)

---

## Stack

The tools and frameworks this project is built with, per part.

### Backend

|                                                                 | Tool                                        | Description                               |
|-----------------------------------------------------------------|---------------------------------------------|-------------------------------------------|
| <img width="32" src="https://github.com/openjdk.png?size=32">   | [Java 25](https://openjdk.org/)             | Language and runtime of the backend       |
| <img width="32" src="https://github.com/quarkusio.png?size=32"> | [Quarkus](https://quarkus.io/)              | Java framework for the backend REST API   |
| <img width="32" src="https://github.com/hibernate.png?size=32"> | [Hibernate ORM](https://hibernate.org/orm/) | Maps the database tables to Java entities |
| <img width="32" src="https://github.com/flyway.png?size=32">    | [Flyway](https://github.com/flyway/flyway)  | Database migrations, run at startup       |
| <img width="32" src="https://github.com/postgres.png?size=32">  | [PostgreSQL](https://www.postgresql.org/)   | Database for the todos                    |

### Frontend

|                                                                            | Tool                                          | Description                                                   |
|----------------------------------------------------------------------------|-----------------------------------------------|---------------------------------------------------------------|
| <img width="32" src="https://github.com/reactjs.png?size=32">              | [React 19](https://react.dev/)                | UI library for the frontend                                   |
| <img width="32" src="https://www.typescriptlang.org/icons/icon-48x48.png"> | [TypeScript](https://www.typescriptlang.org/) | Typed JavaScript for the frontend                             |
| <img width="32" src="https://github.com/vitejs.png?size=32">               | [Vite](https://vite.dev/)                     | Frontend dev server and build tool                            |
| <img width="32" src="https://github.com/vitest-dev.png?size=32">           | [Vitest](https://vitest.dev/)                 | Frontend tests and coverage                                   |
| <img width="32" src="https://github.com/nginx.png?size=32">                | [Nginx](https://nginx.org/)                   | Serves the frontend and passes `/api` calls on to the backend |

### OpenAPI

|                                                                    | Tool                                                 | Description                                                     |
|--------------------------------------------------------------------|------------------------------------------------------|-----------------------------------------------------------------|
| <img width="32" src="https://github.com/OAI.png?size=32">          | [OpenAPI 3.0](https://www.openapis.org/)             | The single description of the API                               |
| <img width="32" src="https://github.com/OpenAPITools.png?size=32"> | [openapi-generator](https://openapi-generator.tech/) | Generates the Java interface and model from the API description |
| <img width="32" src="https://github.com/openapi-ts.png?size=32">   | [openapi-typescript](https://openapi-ts.dev/)        | Generates the TypeScript types from the API description         |

### Kubernetes

|                                                                       | Tool                                        | Description                                       |
|-----------------------------------------------------------------------|---------------------------------------------|---------------------------------------------------|
| <img width="32" src="https://github.com/k3d-io.png?size=32">          | [k3d](https://k3d.io/)                      | Local Kubernetes cluster (k3s in Docker)          |
| <img width="32" src="https://github.com/kubernetes-sigs.png?size=32"> | [Kustomize](https://kustomize.io/)          | Manifest management with a base and a dev overlay |
| <img width="32" src="https://github.com/cloudnative-pg.png?size=32">  | [CloudNativePG](https://cloudnative-pg.io/) | Kubernetes operator that runs PostgreSQL          |

### GitHub Actions

|                                                                             | Tool                                                           | Description                                              |
|-----------------------------------------------------------------------------|----------------------------------------------------------------|----------------------------------------------------------|
| <img width="32" src="https://github.com/actions.png?size=32">               | [GitHub Actions](https://github.com/features/actions)          | Runs the tests, image builds, and releases               |
| <img width="32" src="https://github.com/aquasecurity.png?size=32">          | [Trivy](https://trivy.dev/)                                    | Scans the Docker images for known vulnerabilities        |
| <img width="32" src="https://avatars.githubusercontent.com/u/2810941?s=32"> | [Release Please](https://github.com/googleapis/release-please) | Versions, tags, and CHANGELOGs from Conventional Commits |

### Devcontainer

|                                                                        | Tool                                                         | Description                                                       |
|------------------------------------------------------------------------|--------------------------------------------------------------|-------------------------------------------------------------------|
| <img width="32" src="https://github.com/docker.png?size=32">           | [Docker](https://www.docker.com/)                            | Container images, Docker Compose, and the devcontainer            |
| <img width="32" src="https://mise.jdx.dev/logo.svg">                   | [mise](https://mise.jdx.dev/)                                | Installs the tool versions from `mise.toml`                       |
| <img width="32" src="https://github.com/pre-commit.png?size=32">       | [pre-commit](https://pre-commit.com/)                        | Git hooks that check every commit                                 |
| <img width="32" src="https://github.com/commitizen-tools.png?size=32"> | [Commitizen](https://commitizen-tools.github.io/commitizen/) | Checks commit messages against Conventional Commits (`cz commit`) |

---

## Prerequisites

Before starting, make sure the following is in place.

### With the devcontainer (recommended)

- **Docker:** Running on the host.
- **IDE:** IntelliJ or VS Code with Dev Containers support.
- **Git:** To clone the repository.
- **SSH agent (optional):** Only for Git over SSH in the devcontainer. See [Git over SSH](#git-over-ssh).

The devcontainer contains all other tools: Java, Maven, Node.js, Trivy, kubectl, k3d, and k9s from mise.

### Without the devcontainer

- **Docker:** For PostgreSQL, the tests, the images, and the Kubernetes cluster.
- **mise:** Installs Java, Maven, Node.js, Trivy, kubectl, k3d, and k9s from `mise.toml`, with pinned versions.
- **pre-commit and Commitizen:** For the Git hooks that check every commit.

### GitHub Actions

Release Please needs its own GitHub token:

1. Create a classic personal access token under **Settings > Developer settings > Personal access tokens > Tokens (classic)**, with the `repo` scope.
2. Add it as the repository secret `TODO_APP_GITHUBACTION_TOKEN` under **Settings > Secrets and variables > Actions**.

With the default `GITHUB_TOKEN`, the release tags don't start the image build.

> **Note**: The repository must be public. GitHub asked for that to use the GitHub Actions setup.

---

## Get started

The best and recommended way is to use the devcontainer approach that has all the tools from [Prerequisites](#prerequisites) installed.

### Create the devcontainer

1. Open the project directory in IntelliJ or VS Code.
2. Choose to open it in the container. In VS Code, run **Dev Containers: Reopen in Container**. In IntelliJ, open `.devcontainer/devcontainer.json` and choose **Create Dev Container and Mount Sources**.
3. Wait until the container is built and the setup has finished. The first time takes a few minutes.

What happens while the container is created:

- **`.devcontainer/Dockerfile`:** Builds the image from Ubuntu 24.04, with mise and pre-commit.
- **`devcontainer.json`:** Adds Docker in Docker, and forwards the ports 22111, 22112, 23111, 23112, 5432, and 5433 to the host.
- **`.devcontainer/scripts/setup.sh`:** Runs once after the container is created. It installs the tools from `mise.toml`, and runs `setup_project.sh`.
- **`.devcontainer/scripts/setup_project.sh`:** Installs Commitizen, kubectl completion, and the pre-commit and commit-msg Git hooks.

> **Note**: `setup_project.sh` sets the Git user name and email globally inside the container. Change them in the script to use another name.

### Git over SSH

The devcontainer mounts the host's SSH agent. `DEVCONTAINER_SSH_AUTH_SOCK` tells it where the agent's socket is.

- **Linux:** Works with a systemd SSH agent (`/run/user/1000/ssh-agent.socket`).
- **macOS:** Run the commands below, then restart the IDE. Run `launchctl` again after every restart of the Mac.

**Set up SSH on macOS**

```bash
launchctl setenv DEVCONTAINER_SSH_AUTH_SOCK /run/host-services/ssh-auth.sock
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

### Without the devcontainer

Not recommended, but install [mise](https://mise.jdx.dev/) and run `mise install` in the project root. Then install the Git hooks.

**Install the Git hooks**

```bash
pre-commit install
pre-commit install --hook-type commit-msg
```

### Run it locally

**1. Install all parts at once.** The root `pom.xml` builds `openapi`, `backend`, and `frontend` in the right order. It installs the npm packages, generates the API code, and runs the backend tests. Run it once, and again when `openapi/openapi.yaml` changes.

**From the project root**

```bash
mvn install
```

The tests need Docker. Add `-DskipTests` to skip them. See [Build everything](#build-everything) for more.

**2. Start the database**

```bash
docker compose -f backend/docker-compose.yml up -d
```

**3. Start the backend** in one terminal

```bash
cd backend && ./mvnw quarkus:dev
```

**4. Start the frontend** in another terminal

```bash
cd frontend && npm run dev
```

Then open <http://localhost:22112>.

---

## Ports

The backend and frontend always use the same port in dev mode, with Docker Compose, and in the K3d dev cluster. The prod cluster uses other ports and can run next to them.

| Port    | What                        |
|---------|-----------------------------|
| `22111` | Backend API                 |
| `22112` | Frontend                    |
| `23111` | Backend API, prod cluster   |
| `23112` | Frontend, prod cluster      |
| `5432`  | PostgreSQL                  |
| `5433`  | pgAdmin (database web tool) |

The devcontainer forwards all six ports to the host.

---

## Run everything in containers

Run the database, backend, and frontend together, without dev mode.

**From the project root**

```bash
docker compose up --build
```

The frontend runs on <http://localhost:22112>, and the API on <http://localhost:22111/api/todos>.

> **Note**: Docker Compose uses the same ports as dev mode and the dev cluster (`22111` and `22112`). Stop those first.

---

## Run on Kubernetes

Run the application in a local K3d cluster, with PostgreSQL managed by CloudNativePG. There are two environments, each in its own cluster:

- **dev:** Images built from the local code, on ports 22111 and 22112.
- **prod:** The published `latest` images from GHCR, on ports 23111 and 23112.

**From the project root**

```bash
./kubernetes/scripts/cluster-setup.sh
```

The script asks for `dev` or `prod`, creates that cluster, and deploys it. See the [Kubernetes README](kubernetes/README.md) for the details.

> **Note**: The dev cluster uses the same ports as dev mode (22111 and 22112). Stop dev mode first.

---

## Development workflow

The parts works together as one workflow. A change is first tested in the dev cluster and then released. The release is then tested in the prod cluster.

**From code to the prod cluster**

```
devcontainer ──► dev cluster ──► pull request ──► release ──► prod cluster
write code       test local      test + scan      new images  test the release
                  images
```

1. **Develop in the devcontainer:** All tools and Git hooks are ready.
2. **Test in the dev cluster:** `cluster-setup.sh` with `dev` builds the images from the local code and deploys them on ports 22111 and 22112.
3. **Push a pull request:** GitHub Actions tests and scans the code. After the merge, Release Please opens a release pull request. Merging that one makes the release, and `docker-publish.yaml` publishes the new images to GHCR. See [Release pipeline](#release-pipeline).
4. **Test in the prod cluster:** `cluster-setup.sh` with `prod` runs the published `latest` images on ports `23111` and `23112`.

> **Note**: An existing prod cluster only pulls `latest` when a pod starts. After a new release, run `kubectl rollout restart deployment/backend deployment/frontend -n prod-todo`, or create the cluster again.

This is a CI/CD workflow, not GitOps. A script deploys the clusters. With GitOps, a controller like Flux CD takes the desired state from Git and keeps the cluster in sync with it.

---

## Build everything

The root `pom.xml` builds the three parts in the right order: `openapi` first, then `backend` and `frontend`.

**From the project root**

```bash
mvn install
```

This runs the backend tests, which need Docker. The integration tests and frontend tests don't run here. Add `-DskipTests` to skip the backend tests.

**Build without tests**

```bash
mvn install -DskipTests
```

> **Note**: The root `pom.xml` isn't a parent pom. Each part can still be built on its own, which the Dockerfiles rely on.

---

## Code quality

Code is checked in two places. The pre-commit hooks check every commit locally, and GitHub Actions checks every pull request before it can be merged.

| Check                                         | Runs on                         | Where                      |
|-----------------------------------------------|---------------------------------|----------------------------|
| Commit message format with Commitizen         | every commit                    | pre-commit                 |
| Whitespace and end of file                    | every commit                    | pre-commit                 |
| Java formatting with google-java-format       | every commit, and pull requests | pre-commit, GitHub Actions |
| Java style rules by Checkstyle                | every commit, and pull requests | pre-commit, GitHub Actions |
| Backend tests and integration tests           | pull requests                   | GitHub Actions             |
| Backend coverage, at least 80% by JaCoCo      | pull requests                   | GitHub Actions             |
| Java bug finder by SpotBugs                   | pull requests                   | GitHub Actions             |
| Frontend lint using oxlint                    | every commit, and pull requests | pre-commit, GitHub Actions |
| Frontend formatting with oxfmt                | every commit                    | pre-commit                 |
| Frontend tests, build, and type check         | pull requests                   | GitHub Actions             |
| Frontend coverage, at least 80% by Vitest     | pull requests                   | GitHub Actions             |
| Docker image build for the back- and frontend | pull requests, after the tests  | GitHub Actions             |
| Docker image security scan by Trivy           | pull requests, after the build  | GitHub Actions             |

GitHub Actions has two workflows for each part. The Docker workflow waits until the tests of the same part have passed:

| Part     | Runs on pull requests that change                        | Tests                   | Image build and Trivy scan |
|----------|----------------------------------------------------------|-------------------------|----------------------------|
| Backend  | `backend/`, `openapi/`, `.dockerignore`                  | `backend-testing.yaml`  | `backend-docker.yaml`      |
| Frontend | `frontend/`, `openapi/`, `package.json`, `.dockerignore` | `frontend-testing.yaml` | `frontend-docker.yaml`     |

The workflows are in `.github/workflows/`. Each part posts two comments on the pull request, updated on every push:

- **Coverage:** The total coverage, whether it meets the 80% minimum, and a link to download the full report. See the [backend README](backend/README.md#coverage) and [frontend README](frontend/README.md#coverage) for running it locally.
- **Backend / Frontend Trivy scan:** The number of HIGH and CRITICAL vulnerabilities that have a fix, or "No HIGH or CRITICAL vulnerabilities with a fix" when the image is clean. The full list is inside. The scan only reports for now and doesn't block the pull request.

Both Dockerfiles install the latest security fixes of their base image while building: `apk upgrade` for the frontend (Alpine) and `microdnf upgrade` for the backend (Red Hat UBI). See "Security updates in the image" in the [backend](backend/README.md#security-updates-in-the-image) and [frontend](frontend/README.md#security-updates-in-the-image) READMEs.

**Scan an image locally**

```bash
trivy image <image>
```

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), for example `feat(backend): add due date`. Use `cz commit` for help writing one.

> **Note**: Commit from inside the devcontainer. The Git hooks are installed there. Outside the devcontainer, they only work after installing pre-commit.

---

## Release pipeline

The GitHub Actions workflows work like stages in a Jenkins pipeline. Each stage runs **once**, and the next one starts when it's done.

| Stage             | Workflow                                        | Starts on                                   |
|-------------------|-------------------------------------------------|---------------------------------------------|
| 1. Test           | `backend-testing.yaml`, `frontend-testing.yaml` | A pull request                              |
| 2. Docker + Trivy | `backend-docker.yaml`, `frontend-docker.yaml`   | A pull request, after stage 1 has passed    |
| 3. Release        | `release-please.yaml`                           | Every push to `main`                        |
| 4. Publish        | `docker-publish.yaml`                           | A release tag (`backend-v*`, `frontend-v*`) |

Step by step:

1. Open a pull request with a Conventional Commits title, like `feat(frontend): add filter`. Stages 1 and 2 run, and the pull request gets the coverage and Trivy comments.
2. Merge it. Stage 3 opens (or updates) the **chore: release main** pull request with the new versions and CHANGELOGs. Stages 1 and 2 are **skipped** on that pull request. It only changes versions and CHANGELOGs, because the code was already tested. Skipped checks count as passed.
3. Merge the release pull request. Release Please creates a tag per released part, like `frontend-v0.3.0`.
4. Stage 4 starts on that tag. It only builds the backend or the frontend, depending on the tag. Then it pushes the image to GitHub's container registry:

| Part     | Image                          | Tags                 |
|----------|--------------------------------|----------------------|
| Backend  | `ghcr.io/hansth/todo-backend`  | `0.3.0` and `latest` |
| Frontend | `ghcr.io/hansth/todo-frontend` | `0.3.0` and `latest` |
| Openapi  | None                           | `0.3.0` and `latest` |

> **Note**: The Kubernetes base pins a version tag. The prod overlay uses `latest` on purpose, to keep the local script simple. For GitOps, pin a version tag: a deployment then always shows which version runs.

---

## Releases

[Release Please](https://github.com/googleapis/release-please) makes the versions automatically from the commit messages on `main`. Backend, frontend, and openapi each have their **own version**, tag, and CHANGELOG:

| Part     | Tag example       | CHANGELOG               | Version is also in      |
|----------|-------------------|-------------------------|-------------------------|
| Backend  | `backend-v0.3.0`  | `backend/CHANGELOG.md`  | Only the tag            |
| Frontend | `frontend-v0.3.0` | `frontend/CHANGELOG.md` | `frontend/package.json` |
| openapi  | `openapi-v0.0.2`  | `openapi/CHANGELOG.md`  | `openapi/package.json`  |

How it works:

1. Merge pull requests into `main` with a Conventional Commits title, like `feat(backend): add due date`.
2. Release Please opens (or updates) a pull request called **chore: release main**. It has the new version and the CHANGELOG entries for each part that changed.
3. Merge that pull request to release. That creates the tags and the GitHub releases. The tags start the image build (see [Release pipeline](#release-pipeline)).

> **Note**: For a pull request with more than one commit, the pull request title must be conventional. GitHub's squash merge uses that title as the commit message on `main`. Release Please skips a title like "Trigger GitHub", and no release and no image is made.

Which commits change the version:

| Commit                           | While below 1.0.0 | From 1.0.0 on  |
|----------------------------------|-------------------|----------------|
| `fix: …`                         | 0.1.0 → 0.1.1     | 1.2.0 → 1.2.1  |
| `feat: …`                        | 0.1.0 → 0.2.0     | 1.2.0 → 1.3.0  |
| `feat!: …` or `BREAKING CHANGE:` | 0.1.0 → 0.2.0     | 1.2.0 → 2.0.0  |
| `ci`, `docs`, `test`, `chore`, … | No new version    | No new version |

A part only gets a new version when the commit changes files **in its directory**. The scope in the title (`(backend)`) doesn't decide that. Release Please doesn't change the pom versions (`0.0.1-SNAPSHOT`).

The setup is in three files:

- `release-please-config.json`: The parts and their release type.
- `.release-please-manifest.json`: The current version of each part. Release Please updates it.
- `.github/workflows/release-please.yaml`: The workflow.

---
