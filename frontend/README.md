# Frontend

The frontend web app for the todo application. It's built with React 19, TypeScript and Vite, and talks to the [backend](../backend/) API.

The API is first defined using OpenAPI in [`openapi/openapi.yaml`](../openapi/). The `openapi` package generates TypeScript types from it. The frontend never needs hand-written request or response types.

---

## How it fits together

The frontend only talks to the backend through a typed API client. The types come from the OpenAPI description, and the frontend and backend always agree on the data.

```
@hansterhorst/openapi  # TypeScript types generated from ../openapi/openapi.yaml
        │
        ▼
 src/api/client.ts     # Typed API client (openapi-fetch)
        │
        ▼
 src/api/todos.ts      # listTodos, createTodo, updateTodo, deleteTodo
        │
        ▼
   src/App.tsx         # The page: list, add, mark as done, edit, delete
```

`App.tsx` never calls `fetch` itself. Every request goes through `src/api/todos.ts`.

The application always calls the API on its own address (`/api/...`). Something in between passes those calls on to the backend:

- **In dev:** The Vite dev server (`vite.config.ts`)
- **In the container:** Nginx (`nginx.conf.template`)

The backend URL is never built into the JavaScript, and the browser doesn't need CORS.

---

## Run it locally

You need Node, from `mise.toml`. The devcontainer has it.

**1. Install the packages** from the project root. The frontend is part of an npm workspace together with `openapi`.

**From the project root**
```bash
npm install
```

**2. Start the backend** on port `22111`. See the [backend README](../backend/README.md).

**3. Start the dev server** from the `frontend` directory
```bash
npm run dev
```

The application runs on <http://localhost:22112>, and the `/api` calls go to `http://localhost:22111`.

Before `dev` and `build` start, npm regenerates the OpenAPI types (`predev` / `prebuild`). You never need to run that step by hand.

---

## Scripts

These are the scripts in `frontend/package.json`. Run them from the `frontend` directory, after installing the packages from the project root (see above).

| Command                 | What it does                                                              |
|-------------------------|---------------------------------------------------------------------------|
| `npm run dev`           | Start the dev server with live reload                                     |
| `npm run build`         | Type-check and build the application into `dist/`                         |
| `npm run preview`       | Serve the built application from `dist/`                                  |
| `npm run lint`          | Check the code with oxlint                                                |
| `npm test`              | Run the tests once                                                        |
| `npm run test:watch`    | Run the tests again on every change                                       |
| `npm run test:coverage` | Run the tests, write a coverage report to `coverage/`, and fail below 80% |

---

## Tests

The tests use [Vitest](https://vitest.dev) with Testing Library, in a fake browser (jsdom). They live in `src/test/`:

- `App.test.tsx`: Tests the page the way a user uses it.
- `todos.test.ts`: Tests the API functions.
- `setup.ts`: Shared test setup.

**Run the tests**
```bash
npm test
```

---

## Coverage

Vitest measures which lines in `src/` the tests cover and shows which code is not tested.

**Run the tests with coverage**
```bash
npm run test:coverage
```

Then open `coverage/index.html` in a browser.

- The run fails when line coverage is below 80%, locally and in GitHub Actions.
- The report counts the code in `src/`, without the tests, `main.tsx` and type files.
- Besides `index.html`, it writes `coverage-summary.json`. GitHub Actions reads that file for the pull request comment.

To change the 80% limit, edit `thresholds.lines` in `vite.config.ts`.

In GitHub Actions, every pull request gets a **Frontend coverage** comment. It shows the total line coverage, whether it meets the 80% minimum and a link to download the full report. There's only one comment, updated on every push.

---

## Code quality

Lint and formatting are checked locally on every commit. GitHub Actions runs the lint again, plus the tests, coverage, build and Docker image scan.

| Check                     | When it runs                          | Run it locally                     |
|---------------------------|---------------------------------------|------------------------------------|
| Lint (oxlint)             | every commit, and GitHub Actions      | `npm run lint`                     |
| Formatting (oxfmt)        | every commit                          | `pre-commit run oxfmt --all-files` |
| Tests and coverage (80%)  | GitHub Actions                        | `npm run test:coverage`            |
| Type check and build      | GitHub Actions                        | `npm run build`                    |
| Docker image scan (Trivy) | GitHub Actions, after the image build | `trivy image todo-frontend`        |

The lint rules are in `.oxlintrc.json`. On commit, any warning blocks the commit (`--deny-warnings`). In GitHub Actions, only errors fail the pull request.

GitHub Actions runs two workflows on every pull request that changes `frontend/`, `openapi/`, the root `package.json` or `.dockerignore`:

1. `.github/workflows/frontend-testing.yaml` (job **Frontend Testing**): Installs the packages, generates the API types, lints, runs the tests with coverage, builds and posts the coverage comment.
2. `.github/workflows/frontend-docker.yaml`: Waits until **Frontend Testing** has passed, builds the Docker image, scans it with Trivy and posts a **Frontend Trivy scan** comment.

The formatting check (oxfmt) only runs in pre-commit. oxfmt isn't in `package.json`.

> **Note**: oxlint is pinned to the same version in `package.json` (`1.85.0`) and `.pre-commit-config.yaml` (`v1.85.0`). Update both together. For more background, see [`notes/notes.md`](../notes/notes.md).

---

## Build

The image contains the built application and serves it with Nginx. Build it from the project root, because it needs the `openapi` package.

**Build the Docker image**
```bash
docker build -f frontend/Dockerfile -t todo-frontend .
```

**Scan the image for known vulnerabilities**
```bash
trivy image todo-frontend
```

**Run the container**
```bash
docker run --rm -p 22112:80 \
  -e BACKEND_ORIGIN=http://host.docker.internal:22111 \
  todo-frontend
```

The application runs on <http://localhost:22112>.

`BACKEND_ORIGIN` tells Nginx where the backend is. It's set when the container starts, not when the image is built. The default is `http://host.docker.internal:22111`, a backend running on the host machine.

In GitHub Actions, every pull request builds the image and scans it with Trivy, after the tests pass. The pull request gets a **Frontend Trivy scan** comment:

- A `Total: … (HIGH: …, CRITICAL: …)` line per part of the image with findings
- A line when nothing is found: **No HIGH or CRITICAL vulnerabilities with a fix**
- The full list under **Full result** (click to open)

Only HIGH and CRITICAL vulnerabilities that already have a fix are shown. The scan only reports for now. To block the pull request on findings, set `exit-code: '1'` in the Trivy step of `frontend-docker.yaml`.

### Security updates in the image

The image is based on `nginx:stable-alpine3.24`. Alpine often releases fixes for its packages before the Nginx image is rebuilt. The Dockerfile upgrades all packages while building.

**Upgrade the packages in the Dockerfile**
```dockerfile
RUN apk upgrade --no-cache
```
- `--no-cache`: Downloads a fresh package index and doesn't keep it in the image. A separate `apk update` isn't needed.

Docker caches the upgrade step. The cache is only rebuilt when the base image changes. Until then, fixes released after the cached build are missing from the image.

If Trivy reports a package that should already be fixed, build without the cache:

- **Locally:** Run `docker build --no-cache -f frontend/Dockerfile -t todo-frontend .`
- **In GitHub Actions:** Delete the caches under **Actions > Caches** (or run `gh cache delete --all`), then run the workflow again.

To run the whole application (PostgreSQL, backend and frontend) in containers, use `docker compose up --build` from the project root. To run it in a local Kubernetes cluster, see the [Kubernetes README](../kubernetes/README.md).

---

## Versions

The frontend has its own version. The Release Please workflow (`.github/workflows/release-please.yaml`) sets it from the commits that change files in `frontend/`.

Each release gets:

- A new `version` in `package.json`
- A Git tag: `frontend-vX.Y.Z`
- A GitHub release
- An entry in [`CHANGELOG.md`](CHANGELOG.md)

> **Note**: Don't edit the version or the `CHANGELOG.md` by hand. See "Releases" in the [root README](../README.md#releases).

When a `frontend-v*` tag is created, `.github/workflows/docker-publish.yaml` builds the image and pushes it to GitHub's container registry as `ghcr.io/hansth/todo-frontend:X.Y.Z` and `:latest`. See "Release pipeline" in the [root README](../README.md#release-pipeline).
