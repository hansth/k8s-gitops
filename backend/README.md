# Backend

The backend REST API for the todo application. It stores todos in PostgreSQL and is built with [Quarkus](https://quarkus.io/) on Java 25.

The API is first defined in an OpenAPI spec, `openapi/openapi.yaml`. The `openapi` module generates the Java interface (`TodosApi`) and models (`Todo`) from it, and this backend implements that interface.

---

## File structure

The code has three layers: `TodoResource` handles the REST calls, `TodoService` holds the business logic, and `TodoRepository` reads and writes the database.

```
src/main/java/com/hansterhorst/
├── resources/       # REST endpoints with the generated TodosApi
├── services/        # TodoService: business logic and transactions
├── repositories/    # TodoRepository: database access
├── entities/        # TodoEntity, BaseEntity: the database tables
└── exceptions/      # NotFoundException
src/main/resources/
├── application.yaml # Application settings
└── db/migration/    # Flyway SQL scripts, run at startup
src/test/
├── java/            # Tests
└── http/todos.http  # Test requests for the IntelliJ HTTP client
```

---

## Run it locally

You need Docker, and the tools from `mise.toml` (Java, Maven, Node.js). The devcontainer has all of these.

**1. Install the `openapi` module** once, and again when you change `openapi.yaml`. The backend and frontend depend on it, and it isn't published anywhere.

**From the project root**

```bash
./backend/mvnw -f pom.xml -pl openapi -am install -DskipTests
```

To build everything at once, run `mvn install` from the project root. See "Build everything" in the [root README](../README.md#build-everything).

**2. Start PostgreSQL** (and pgAdmin) from the `backend` directory

```bash
docker compose up -d
```

- PostgreSQL: `localhost:5432`, user `hansth`, password `password`
- pgAdmin: <http://localhost:5433>, login `admin@example.com` / `admin`

**3. Start the backend in dev mode**

```bash
./mvnw quarkus:dev
```

Code changes reload automatically.

The API runs on <http://localhost:22111>. Flyway creates the tables on startup.

Useful pages in dev mode:

| Page         | URL                                   |
|--------------|---------------------------------------|
| Dev UI       | <http://localhost:22111/q/dev-ui>     |
| Swagger UI   | <http://localhost:22111/q/swagger-ui> |
| OpenAPI spec | <http://localhost:22111/q/openapi>    |
| Health check | <http://localhost:22111/health>       |

---

## API

`TodoResource` implements the endpoints from `openapi/openapi.yaml`. All paths start with `/api/todos`.

| Method   | Path              | What it does   |
|----------|-------------------|----------------|
| `GET`    | `/api/todos`      | List all todos |
| `POST`   | `/api/todos`      | Create a todo  |
| `GET`    | `/api/todos/{id}` | Get one todo   |
| `PUT`    | `/api/todos/{id}` | Update a todo  |
| `DELETE` | `/api/todos/{id}` | Delete a todo  |

**A todo in JSON**

```json
{
  "id": 1,
  "title": "Buy milk",
  "completed": false
}
```

An unknown `id` returns `404 Not Found`.

**Try the API with curl**

```bash
curl -X POST localhost:22111/api/todos -H 'Content-Type: application/json' -d '{"title":"Buy milk"}'
curl localhost:22111/api/todos
```

Or open `src/test/http/todos.http` in IntelliJ. It has a request for each endpoint. Click the run icon next to a request to send it.

---

## Settings

Set these as environment variables to override the defaults in `application.yaml`:

| Variable      | Default (dev)                             | Default (prod)                          | What it is          |
|---------------|-------------------------------------------|-----------------------------------------|---------------------|
| `DB_URL`      | `jdbc:postgresql://localhost:5432/hansth` | `jdbc:postgresql://localhost:5432/todo` | database connection |
| `DB_USERNAME` | `hansth`                                  | `todo`                                  | database user       |
| `DB_PASSWORD` | `password`                                | `todo`                                  | database password   |

CORS is turned off (`quarkus.http.cors.enabled: false`). The browser only talks to the frontend's address, and the Vite dev server or Nginx passes the `/api` calls on to the backend. The backend never gets a request from another origin.

---

## Database changes

Flyway changes the database, not Hibernate. Hibernate only checks that the tables match the entities (`validate`).

To change the database, add a new script in `src/main/resources/db/migration/`. Flyway runs it on the next startup.

**Add a column in `V2__add_due_date.sql`**

```sql
ALTER TABLE todos ADD COLUMN due_date DATE;
```

Then add the matching field to `TodoEntity`. When an entity field has no matching column, the backend doesn't start.

> **Note**: Never edit a script that has already run. Flyway stores a checksum of each script and stops the startup when it changes.

---

## Tests

There are three kinds of tests, and all of them need Docker:

1. Repository tests (`TodoRepositoryTest`)
2. API tests that call the REST endpoints (`TodoResourceTest`)
3. Integration tests against the packaged application (`TodoResourceIT`)

**Repository and API tests**

```bash
./mvnw test
```

**Also run the integration tests**

```bash
./mvnw verify -DskipITs=false
```

Quarkus starts a temporary PostgreSQL container for the tests and removes it afterwards. The integration tests get a container of their own. You don't need the database from `docker compose`.

To run an integration test from IntelliJ, build the package first. The integration tests start the packaged application from `target/quarkus-app/`. `./mvnw verify` builds that package on its own, but IntelliJ doesn't.

**Build the package for IntelliJ**

```bash
./mvnw package -DskipTests
```

---

## Coverage

JaCoCo measures which lines the tests cover and shows which code is not tested. `./mvnw verify` writes the report. Add `-DskipITs=false` to include the integration tests.

**Run all tests, including the integration tests**

```bash
./mvnw verify -DskipITs=false
```

Then open `target/jacoco-report/index.html` in a browser.

- The build fails when coverage is below 80%. This is checked in `./mvnw verify`, locally and in GitHub Actions. To change the limit, edit `<minimum>0.80</minimum>` in the `jacoco-maven-plugin` in `pom.xml`.
- Generated code from `openapi.yaml` is not counted.
- `./mvnw test` doesn't make a report and doesn't check coverage. That only happens in `./mvnw verify`.

In GitHub Actions, every pull request gets a **Backend coverage** comment. It shows the total coverage and whether it meets the 80% minimum. It also has two links:

- **Download the full report:** The **backend-coverage** artifact. Unzip it and open `index.html`.
- **Coverage per file:** The workflow run page, which has a table per file.

There's only one comment, updated on every push. It only appears when the tests get far enough to write a report.

---

## Code quality

Formatting and style are checked locally on every commit, and again in GitHub Actions. That catches commits that skipped the Git hooks. Everything else runs only in GitHub Actions.

| Check                                         | When it runs                          | Run it locally                  |
|-----------------------------------------------|---------------------------------------|---------------------------------|
| Formatting by google-java-format via Spotless | every commit, and GitHub Actions      | `./mvnw spotless:apply`         |
| Style rules use Checkstyle, Google rules      | every commit, and GitHub Actions      | `./mvnw checkstyle:check`       |
| Tests and coverage at least 80%               | GitHub Actions                        | `./mvnw verify -DskipITs=false` |
| Bug finder by SpotBugs                        | GitHub Actions                        | `./mvnw compile spotbugs:check` |
| Docker image scan by Trivy                    | GitHub Actions, after the image build | `trivy image todo-backend`      |

GitHub Actions runs these on every pull request that changes `backend/`, `openapi/`, or `.dockerignore` (`.github/workflows/backend-testing.yaml`). After those tests pass, `.github/workflows/backend-docker.yaml` builds the Docker image and scans it with Trivy.

A Checkstyle violation stops the commit and fails the pull request. Some rules are turned off with `violationIgnore` in `pom.xml`:

- `MissingJavadocType`, `MissingJavadocMethod`: Javadoc is not required. The class and method names already explain what they do.
- `AvoidStarImport`: Star imports like `import java.util.*` are allowed.
- `AbbreviationAsWordInName`: Allows integration test names that end in `IT`, like `TodoResourceIT`.

---

## Build

The build makes a Quarkus application in `target/quarkus-app/`. Run it with plain Java, or put it in a Docker image (see below).

**Build the application**

```bash
./mvnw package
```

**Run the application**

```bash
java -jar target/quarkus-app/quarkus-run.jar
```

The Docker image is built from the project root directory, because it needs the `openapi` module.

**Build the Docker image**

```bash
docker build -f backend/Dockerfile -t todo-backend .
```

**Scan the image for known vulnerabilities**

```bash
trivy image todo-backend
```

In GitHub Actions, every pull request builds the image and scans it with Trivy, after the tests pass. The pull request gets a **Backend Trivy scan** comment:

- A `Total: … (HIGH: …, CRITICAL: …)` line per part of the image with findings, for example the OS packages and the Java libraries
- A line when nothing is found: **No HIGH or CRITICAL vulnerabilities with a fix**
- The full list under **Full result** (click to open)

Only HIGH and CRITICAL vulnerabilities that already have a fix are shown. The scan only reports for now. To block the pull request on findings, set `exit-code: '1'` in the Trivy step of `backend-docker.yaml`.

### Security updates in the image

The image is based on Red Hat UBI 9 (`ubi9/openjdk-25-runtime`). Red Hat often releases fixes for its packages before the base image is rebuilt. The Dockerfile upgrades all packages while building.

**Upgrade the packages in the Dockerfile**

```dockerfile
USER root
RUN microdnf upgrade -y --nodocs --setopt=install_weak_deps=0 && microdnf clean all
```

- `USER root`: The base image runs as user `185`, and upgrading packages needs root permissions.
- `--nodocs`: Doesn't install documentation.
- `--setopt=install_weak_deps=0`: Doesn't install optional extra packages.
- `microdnf clean all`: Removes the downloaded package data.

Docker caches the upgrade step. The cache is only rebuilt when the base image changes. Until then, fixes released after the cached build are missing from the image.

If Trivy reports a package that should already be fixed, build without the cache:

- **Locally:** Run `docker build --no-cache -f backend/Dockerfile -t todo-backend .`
- **In GitHub Actions:** Delete the caches under **Actions > Caches** (or run `gh cache delete --all`), then run the workflow again.

To run the whole application (PostgreSQL, backend, and frontend) in containers, use `docker compose up --build` from the project root. To run it in a local Kubernetes cluster, see the [Kubernetes README](../kubernetes/README.md).

---

## Versions

The backend has its own version. The Release Please workflow (`.github/workflows/release-please.yaml`) sets it from the commits that change files in `backend/`.

Each release gets:

- A Git tag: `backend-vX.Y.Z`
- A GitHub release
- An entry in [`CHANGELOG.md`](CHANGELOG.md)

> **Note**: Don't edit the version or the `CHANGELOG.md` by hand. See "Releases" in the [root README](../README.md#releases).

When a `backend-v*` tag is created, `.github/workflows/docker-publish.yaml` builds the image and pushes it to GitHub's container registry as `ghcr.io/hansth/todo-backend:X.Y.Z` and `:latest`. See "Release pipeline" in the [root README](../README.md#release-pipeline).

> **Note**: The Maven version in `pom.xml` (`0.0.1-SNAPSHOT`) isn't changed by Release Please. The `openapi` dependency version in `pom.xml` must match `<version>` in `openapi/pom.xml`. When one changes, change the other. See "Releases" in the [root README](../README.md#releases).

---
