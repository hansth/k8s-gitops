# OpenAPI

The single description of the todo API. Both the [backend](../backend/) and the [frontend](../frontend/) are built from
`openapi.yaml`, so they always agree on the endpoints and the data. Change the API here first, never in the backend or
frontend code.

## What gets generated

From `openapi.yaml`, this module generates code for both sides:

| For      | What                                             | Where it ends up                                            | Made by                          |
|----------|--------------------------------------------------|-------------------------------------------------------------|----------------------------------|
| Backend  | Java interface `TodosApi` and model class `Todo` | a jar, `com.hansterhorst:openapi`, in your local Maven repo | openapi-generator (`jaxrs-spec`) |
| Frontend | TypeScript types in `schema.d.ts`                | the npm workspace package `@hansterhorst/openapi`           | openapi-typescript               |

- **Backend:** `TodoResource` implements the generated `TodosApi`. If the spec changes, the backend no longer compiles
  until it matches. The Java code lands in the packages `com.hansterhorst.resources.generated.api` and
  `com.hansterhorst.resources.generated.model`.
- **Frontend:** the API client (`frontend/src/api/client.ts`) uses the generated types. If the spec changes,
  `npm run build` fails until the frontend matches.

Generated files are not committed. `schema.d.ts` and `target/` are in `.gitignore`.

## Files

```
openapi.yaml    the API description (OpenAPI 3.0)
pom.xml         Maven build: generates and packages the Java code, and runs the TypeScript step
package.json    the npm package @hansterhorst/openapi, with the `generate` script for TypeScript
```

## Generate the code

**Everything at once**, from the project root. This also runs `npm install` for the whole workspace:

```bash
./backend/mvnw -f pom.xml -pl openapi -am install -DskipTests
```

Run this once after cloning, and again every time you change `openapi.yaml`. The backend only sees the new version after
this `install`.

**Only the TypeScript types**, from this folder:

```bash
npm run generate
```

You rarely need this by hand: the frontend's `npm run dev` and `npm run build` run it for you first.

## The API

| Method   | Path              | operationId   | Answer                               |
|----------|-------------------|---------------|--------------------------------------|
| `GET`    | `/api/todos`      | `listTodos`   | `200` with a list of todos           |
| `POST`   | `/api/todos`      | `createTodo`  | `201`                                |
| `GET`    | `/api/todos/{id}` | `getTodoById` | `200` with the todo, or `404`        |
| `PUT`    | `/api/todos/{id}` | `updateTodo`  | `204`, or `404`                      |
| `DELETE` | `/api/todos/{id}` | `deleteTodo`  | `204`, or `404`                      |

A `Todo` has three fields:

| Field       | Type               | Notes                                     |
|-------------|--------------------|-------------------------------------------|
| `id`        | integer (`int64`)  | read-only: set by the server, not sent in |
| `title`     | string             |                                           |
| `completed` | boolean            |                                           |

The `operationId` becomes the method name in the Java interface. For example, `listTodos` becomes
`TodosApi.listTodos()`.

## Changing the API

1. Edit `openapi.yaml`.
2. Run the `install` command above.
3. Fix the backend until it compiles again. `TodoResource` must implement every method in the new `TodosApi`.
4. Fix the frontend until `npm run build` passes, usually in `frontend/src/api/todos.ts`.
5. Commit the spec change together with the backend and frontend changes, so they never get out of step.

## Good to know

- **The backend Docker image** builds this module with `-Dexec.skip=true`. The Maven image has no Node, so the npm steps
  are skipped there. Only the Java part is needed for the backend.
- **`npm install --no-package-lock`:** the Maven build runs npm without a lockfile. This works around an npm bug with
  platform-specific optional packages (npm/cli#4828). The frontend `Dockerfile` does the same.
- **View the API in a browser:** start the backend in dev mode and open <http://localhost:22111/q/swagger-ui>.
