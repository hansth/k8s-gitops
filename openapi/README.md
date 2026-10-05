# OpenAPI

[OpenAPI](https://www.openapis.org/) is a standard way to describe a REST API in one YAML or JSON file: the endpoints, the parameters, the data, and the answers. In this project, [openapi-generator](https://openapi-generator.tech/) generates the Java interface for the [backend](../backend/), and [openapi-typescript](https://openapi-ts.dev/) the TypeScript types for the [frontend](../frontend/).

This directory has the description of the todo API, `openapi.yaml`. The Java interface and the TypeScript types both come from this one file. The backend and frontend always agree on the endpoints and the data. This is called *API-first*: the API is described before the code is written.

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

**1. Generate the Java and TypeScript code.** This also runs `npm install` for the whole workspace.

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

The API has one resource, todos, with endpoints to list, create, read, update, and delete them. Each endpoint has an `operationId`, which becomes the method name in the generated code. For example, `listTodos` becomes `TodosApi.listTodos()` in Java.

| Method   | Path              | operationId   | Answer                        |
|----------|-------------------|---------------|-------------------------------|
| `GET`    | `/api/todos`      | `listTodos`   | `200` with a list of todos    |
| `POST`   | `/api/todos`      | `createTodo`  | `204`                         |
| `GET`    | `/api/todos/{id}` | `getTodoById` | `200` with the todo, or `404` |
| `PUT`    | `/api/todos/{id}` | `updateTodo`  | `204`, or `404`               |
| `DELETE` | `/api/todos/{id}` | `deleteTodo`  | `204`, or `404`               |

A `Todo` has three fields:

| Field       | Type              | Notes                        |
|-------------|-------------------|------------------------------|
| `id`        | integer (`int64`) | Read-only: set by the server |
| `title`     | string            |                              |
| `completed` | boolean           |                              |

To view the API in a browser, start the backend in dev mode and open Swagger UI on <http://localhost:22111/q/swagger-ui>.

**Start the backend in dev mode from the `backend` directory**

```bash
./mvnw quarkus:dev
```

---

## Changing the API

A change to the API starts in `openapi.yaml`. The generated code then shows what the backend and frontend still need.

1. Edit `openapi.yaml`.
2. Generate the code again, with the install command in [Generate the code](#generate-the-code).
3. Fix the backend until it compiles again. `TodoResource` must implement every method in the new `TodosApi`.
4. Fix the frontend until `npm run build` passes, usually in `frontend/src/api/todos.ts`.
5. Commit the spec change together with the backend and frontend changes. The spec and the code then always stay in step.

> **Note**: A `feat` or `fix` commit with changes in `openapi/`, `backend/`, and `frontend/` makes a new version of all three parts.

---

## Good to know about the Maven build

The Maven build of this module also runs npm, for the TypeScript types. Two things about that build aren't obvious at first sight.

### The backend Docker image skips the npm steps

The Maven image in `backend/Dockerfile` has no Node.js. It builds this module with `-Dexec.skip=true`, which skips the npm steps. The backend only needs the Java part.

### npm runs without a lockfile

The Maven build runs `npm install --no-package-lock`. This works around an npm bug with platform-specific optional packages ([npm/cli#4828](https://github.com/npm/cli/issues/4828)). The frontend `Dockerfile` and GitHub Actions do the same.

Without a lockfile, npm installs the newest version that matches each range in `package.json`. Pin an exact version when two tools must use the same one, like oxlint in the frontend.

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

---
