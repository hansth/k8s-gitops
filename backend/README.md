# Backend

The REST API for the todo app. It stores todos in PostgreSQL and is built with [Quarkus](https://quarkus.io/) on Java 25
(compiled for Java 21).

The API is defined first in `openapi/openapi.yaml`. The `openapi` module generates the Java interface (`TodosApi`) and
models (`Todo`) from it, and this backend implements that interface.

## Project layout

```
src/main/java/com/hansterhorst/
├── resources/      TodoResource: the REST endpoints, implements the generated TodosApi
├── services/       TodoService: business logic and transactions
├── repositories/   TodoRepository: database access (Hibernate Panache)
├── entities/       TodoEntity, BaseEntity: the database tables
└── exceptions/     NotFoundException and the mapper that turns it into a 404
src/main/resources/
├── application.yaml       settings
└── db/migration/          Flyway SQL scripts, run at startup
src/test/
├── java/                  tests
└── http/todos.http        example requests for the IntelliJ HTTP client
```

## Run it locally

You need Docker, and the tools from `mise.toml` (Java, Maven, Node). The devcontainer has all of these.

**1. Install the `openapi` module** (once, and again after you change `openapi.yaml`). The backend depends on it and it
isn't published anywhere:

```bash
./backend/mvnw -f pom.xml -pl openapi -am install -DskipTests   # from the project root
```

**2. Start PostgreSQL** (and pgAdmin) from the `backend` folder:

```bash
docker compose up -d
```

- PostgreSQL: `localhost:5432`, user `hansth`, password `password`
- pgAdmin: <http://localhost:5433>, login `admin@example.com` / `admin`

**3. Start the backend in dev mode.** Code changes reload automatically:

```bash
./mvnw quarkus:dev
```

The API runs on <http://localhost:22111>. Flyway creates the tables on startup.

Useful pages in dev mode:

| Page         | URL                                   |
|--------------|---------------------------------------|
| Dev UI       | <http://localhost:22111/q/dev-ui>     |
| Swagger UI   | <http://localhost:22111/q/swagger-ui> |
| OpenAPI spec | <http://localhost:22111/q/openapi>    |
| Health check | <http://localhost:22111/health>       |

## API

| Method   | Path              | What it does   |
|----------|-------------------|----------------|
| `GET`    | `/api/todos`      | List all todos |
| `POST`   | `/api/todos`      | Create a todo  |
| `GET`    | `/api/todos/{id}` | Get one todo   |
| `PUT`    | `/api/todos/{id}` | Update a todo  |
| `DELETE` | `/api/todos/{id}` | Delete a todo  |

A todo looks like this:

```json
{
  "id": 1,
  "title": "Buy milk",
  "completed": false
}
```

An unknown `id` returns `404 Not Found`. Try the requests in `src/test/http/todos.http`, or with curl:

```bash
curl -X POST localhost:22111/api/todos -H 'Content-Type: application/json' -d '{"title":"Buy milk"}'
curl localhost:22111/api/todos
```

## Settings

Set these as environment variables to override the defaults in `application.yaml`:

| Variable      | Default (dev)                             | Default (prod)                          | What it is                               |
|---------------|-------------------------------------------|-----------------------------------------|------------------------------------------|
| `DB_URL`      | `jdbc:postgresql://localhost:5432/hansth` | `jdbc:postgresql://localhost:5432/todo` | database connection                      |
| `DB_USERNAME` | `hansth`                                  | `todo`                                  | database user                            |
| `DB_PASSWORD` | `password`                                | `todo`                                  | database password                        |
| `CORS_ORIGIN` | `http://localhost:22112`                  | same                                    | the frontend URL allowed to call the API |

## Database changes

Hibernate only checks the tables (`validate`); it never changes them. To change the database, add a new Flyway script in
`src/main/resources/db/migration/`, for example `V2__add_due_date.sql`. Never edit a script that has already run.

## Tests

```bash
./mvnw test                     # unit and API tests
./mvnw verify -DskipITs=false   # also runs the integration tests (*IT) against the packaged app
```

The tests need Docker. Quarkus starts a temporary PostgreSQL container for them (Dev Services), so you don't need the
one from `docker compose`.

## Code quality

| Check                                        | When it runs                       | Run it yourself                 |
|----------------------------------------------|------------------------------------|---------------------------------|
| Formatting (google-java-format via Spotless) | every commit                       | `./mvnw spotless:apply`         |
| Style rules (Checkstyle, Google rules)       | every commit, blocks on violations | `./mvnw checkstyle:check`       |
| Bug finder (SpotBugs)                        | GitHub Actions only                | `./mvnw compile spotbugs:check` |

Missing Javadoc is allowed. For the full story, see `notes.md` in the project root.

## Build

```bash
./mvnw package                   # builds target/quarkus-app/
java -jar target/quarkus-app/quarkus-run.jar
```

The Docker image is built from the project root, because it needs the `openapi` module too:

```bash
docker build -f backend/Dockerfile -t todo-backend .
```

To run the whole app (PostgreSQL, backend and frontend) in containers, use `docker compose up --build` from the project
root.
