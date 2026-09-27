# Todo App

A small todo app with a Java backend, a React frontend and a PostgreSQL database. The API is described once in an
OpenAPI file, and both the backend and the frontend are built from it.

## Parts

| Directory                | What it is                                          | Tech                                |
|--------------------------|-----------------------------------------------------|-------------------------------------|
| `.devcontainer/`         | the development container with all tools installed  | Docker, mise                        |
| [`backend/`](backend/)   | the REST API, stores todos in PostgreSQL            | Quarkus, Java 25, Hibernate, Flyway |
| [`frontend/`](frontend/) | the web app                                         | React 19, TypeScript, Vite          |
| [`openapi/`](openapi/)   | the API description, and the code generated from it | OpenAPI 3.0, openapi-generator, npm |

Each folder has its own README with the details.

```
openapi/openapi.yaml
      │ generates
      ├──────────────► Java interface ──► backend  (port 22111) ──► PostgreSQL (port 5432)
      └──────────────► TypeScript types ─► frontend (port 22112) ──► calls /api on the backend
```

## Get started

The easiest way is the devcontainer. It has Java, Maven, Node and trivy (versions in `mise.toml`), Docker, and the git
hooks. Open the project in IntelliJ or VS Code and choose to open it in the container. The setup runs on its own.

Without the devcontainer, install [mise](https://mise.jdx.dev/) and run `mise install` in the project root.

**1. Install the packages and generate the API code** (once, and again after you change `openapi/openapi.yaml`):

```bash
./backend/mvnw -f pom.xml -pl openapi -am install -DskipTests
```

**2. Start the database**:

```bash
docker compose -f backend/docker-compose.yml up -d
```

**3. Start the backend** in one terminal:

```bash
cd backend && ./mvnw quarkus:dev
```

**4. Start the frontend** in another terminal:

```bash
cd frontend && npm run dev
```

Open <http://localhost:22112>.

## Ports

| Port    | What                        |
|---------|-----------------------------|
| `22111` | backend API                 |
| `22112` | frontend                    |
| `5432`  | PostgreSQL                  |
| `5433`  | pgAdmin (database web tool) |

The devcontainer forwards all four to your machine.

## Run everything in containers

To run the database, backend and frontend together, without dev mode:

```bash
docker compose up --build
```

The frontend is then on <http://localhost:22112> and the API on <http://localhost:22111/api/todos>.

## Build everything

The root `pom.xml` builds the three parts in the right order: `openapi` first, then `backend` and `frontend`.

```bash
./backend/mvnw -f pom.xml install
```

It is not a parent pom. Each part can still be built on its own, which the Dockerfiles rely on.

## Code quality

| Check                                        | Runs on                       | Where                 |
|----------------------------------------------|-------------------------------|-----------------------|
| Commit message format (commitizen)           | every commit                  | pre-commit            |
| Whitespace and end of file                   | every commit                  | pre-commit            |
| Java formatting (google-java-format)         | every commit                  | pre-commit            |
| Java style rules (Checkstyle)                | every commit                  | pre-commit            |
| Frontend lint and formatting (oxlint, oxfmt) | every commit                  | pre-commit            |
| Java bug finder (SpotBugs)                   | push to `main`, pull requests | GitHub Actions        |
| Docker image security scan (trivy)           | by hand                       | `trivy image <image>` |

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), for example
`feat(backend): add due date`. Use `cz commit` if you want help writing one.

Commit from inside the devcontainer. The git hooks are installed there and won't work from your own machine unless you
install pre-commit there too.

More background, including problems we ran into and how they were fixed, is in [`notes.md`](notes.md).
