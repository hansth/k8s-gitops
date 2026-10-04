# OpenAPI

The single description of the todo API. Both the [backend](../backend/) and the [frontend](../frontend/) are built from `openapi.yaml`. They always agree on the endpoints and the data.

> **Note**: Change the API here first, never in the backend or frontend code.

---

## What gets generated

From `openapi.yaml`, this module generates code for both sides:

| For      | What                                             | Where it ends up                                  | Made by                          |
|----------|--------------------------------------------------|---------------------------------------------------|----------------------------------|
| Backend  | Java interface `TodosApi` and model class `Todo` | A jar, `com.hansterhorst:openapi`, in `~/.m2`     | openapi-generator (`jaxrs-spec`) |
| Frontend | TypeScript types in `schema.d.ts`                | The npm workspace package `@hansterhorst/openapi` | openapi-typescript               |

- **Backend:** `TodoResource` implements the generated `TodosApi`. When the spec changes, the backend doesn't compile until it matches. The Java code is in the packages `com.hansterhorst.resources.generated.api` and `com.hansterhorst.resources.generated.model`.
- **Frontend:** The API client (`frontend/src/api/client.ts`) and `frontend/src/api/todos.ts` use the generated types. When the spec changes, `npm run build` fails until the frontend matches.

Generated files are not committed. `schema.d.ts` and `target/` are in `.gitignore`.

---

## File structure

The module has the API description, and the build files that generate the code from it.

```
openapi.yaml    # The API description (OpenAPI 3.0)
pom.xml         # Maven build: generates and packages the Java code,
                # and runs the TypeScript step
package.json    # The npm package @hansterhorst/openapi,
                # with the `generate` script for TypeScript
```

---

## Generate the code

**1. Generate everything at once.** This also runs `npm install` for the whole workspace.

**From the project root**
```bash
./backend/mvnw -f pom.xml -pl openapi -am install -DskipTests
```

Run this once after cloning, and again every time `openapi.yaml` changes. The backend only sees the new version after this `install`.

To build everything at once, run `mvn install` from the project root. See "Build everything" in the [root README](../README.md#build-everything).

**2. Generate only the TypeScript types** from the `openapi` directory
```bash
npm run generate
```

This is rarely needed by hand. The frontend's `npm run dev` and `npm run build` run it first.

---

## The API

The API has one resource, todos, with endpoints to list, create, read, update and delete them. Each endpoint has an `operationId`, which becomes the method name in the generated code. For example, `listTodos` becomes `TodosApi.listTodos()` in Java.

| Method   | Path              | operationId   | Answer                        |
|----------|-------------------|---------------|-------------------------------|
| `GET`    | `/api/todos`      | `listTodos`   | `200` with a list of todos    |
| `POST`   | `/api/todos`      | `createTodo`  | `204`                         |
| `GET`    | `/api/todos/{id}` | `getTodoById` | `200` with the todo, or `404` |
| `PUT`    | `/api/todos/{id}` | `updateTodo`  | `204`, or `404`               |
| `DELETE` | `/api/todos/{id}` | `deleteTodo`  | `204`, or `404`               |

A `Todo` has three fields:

| Field       | Type              | Notes                                     |
|-------------|-------------------|-------------------------------------------|
| `id`        | integer (`int64`) | Read-only: set by the server, not sent in |
| `title`     | string            |                                           |
| `completed` | boolean           |                                           |

---

## Changing the API

1. Edit `openapi.yaml`.
2. Run the `install` command above.
3. Fix the backend until it compiles again. `TodoResource` must implement every method in the new `TodosApi`.
4. Fix the frontend until `npm run build` passes, usually in `frontend/src/api/todos.ts`.
5. Commit the spec change together with the backend and frontend changes. The spec and the code then always stay in step.

---

## Good to know

A few details that aren't obvious from the files themselves.

### The backend Docker image skips the npm steps

The Maven image in `backend/Dockerfile` has no Node. It builds this module with `-Dexec.skip=true`, which skips the npm steps. The backend only needs the Java part.

### npm runs without a lockfile

The Maven build runs `npm install --no-package-lock`. This works around an npm bug with platform-specific optional packages ([npm/cli#4828](https://github.com/npm/cli/issues/4828)). The frontend `Dockerfile` and GitHub Actions do the same.

Without a lockfile, npm installs the newest version that matches each range in `package.json`. Pin an exact version when two tools must use the same one, like oxlint in the frontend.

### View the API in a browser

Start the backend in dev mode, then open Swagger UI on <http://localhost:22111/q/swagger-ui>.

**Start the backend in dev mode from the `backend` directory**
```bash
./mvnw quarkus:dev
```

---

## Versions

The API has its own version. The Release Please workflow (`.github/workflows/release-please.yaml`) sets it from the commits that change files in `openapi/`.

Each release gets:

- A new `version` in `package.json`
- A Git tag: `openapi-vX.Y.Z`
- A GitHub release
- An entry in [`CHANGELOG.md`](CHANGELOG.md)

The openapi module gets no Docker image.

> **Note**: Don't edit the version or the `CHANGELOG.md` by hand. See "Releases" in the [root README](../README.md#releases).

> **Note**: The Maven version in `pom.xml` (`0.0.1-SNAPSHOT`) isn't changed by Release Please, on purpose. The backend depends on exactly this version. When it changes, change the `openapi` dependency in `backend/pom.xml` too. Otherwise the backend build fails.

The plan to publish openapi as a Maven jar and an npm package on GitHub Packages is in [`notes/notes-openapi-split.md`](../notes/notes-openapi-split.md).
