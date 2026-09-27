# Frontend

The web app for the todo app. It's built with React 19, TypeScript and Vite, and talks to the [backend](../backend/)
API.

The API is defined first in [`openapi/openapi.yaml`](../openapi/). The `openapi` package generates TypeScript types from
it, so the frontend never needs hand-written request or response types. If the API changes in a way the frontend doesn't
expect, `npm run build` fails before you open a browser.

## How it fits together

```
@hansterhorst/openapi      TypeScript types generated from ../openapi/openapi.yaml
        │
        ▼
src/api/client.ts          typed API client (openapi-fetch)
        │
        ▼
src/api/todos.ts           listTodos, createTodo, updateTodo, deleteTodo
        │
        ▼
src/App.tsx                the page: list, add, mark as done, edit, delete
```

`App.tsx` never calls `fetch` itself. Every request goes through `src/api/todos.ts`.

The app always calls the API on its own address (`/api/...`). Something in between passes those calls on to the backend:

- in dev, the Vite dev server (`vite.config.ts`)
- in the container, nginx (`nginx.conf.template`)

So the backend URL is never built into the JavaScript, and the browser doesn't need CORS.

## Run it locally

You need Node, from `mise.toml`. The devcontainer has it.

**1. Install packages from the project root**, not from this folder. The frontend is part of an npm workspace together
with `openapi`:

```bash
npm install   # in the project root
```

**2. Start the backend** on port `22111`. See the [backend README](../backend/README.md).

**3. Start the dev server** from the `frontend` folder:

```bash
npm run dev
```

The app runs on <http://localhost:22112>. Calls to `/api` go to `http://localhost:22111`.

Before `dev` and `build` start, npm regenerates the OpenAPI types for you (`predev` / `prebuild`). You never need to run
that step by hand.

## Scripts

| Command                 | What it does                                             |
|-------------------------|----------------------------------------------------------|
| `npm run dev`           | start the dev server with live reload                    |
| `npm run build`         | type-check and build the app into `dist/`                |
| `npm run preview`       | serve the built app from `dist/`                         |
| `npm run lint`          | check the code with oxlint                               |
| `npm test`              | run the tests once                                       |
| `npm run test:watch`    | run the tests again on every change                      |
| `npm run test:coverage` | run the tests and write a coverage report to `coverage/` |

## Tests

The tests use Vitest with Testing Library, in a fake browser (jsdom). They live in `src/test/`:

- `App.test.tsx`: tests the page the way a user uses it
- `todos.test.ts`: tests the API functions
- `setup.ts`: shared test setup

## Code quality

| Check                                    | When it runs                        | Run it yourself                    |
|------------------------------------------|-------------------------------------|------------------------------------|
| Lint (oxlint, rules in `.oxlintrc.json`) | every commit, any warning blocks it | `npm run lint`                     |
| Formatting (oxfmt)                       | every commit                        | `pre-commit run oxfmt --all-files` |

The oxlint version in pre-commit (`v1.85.0`) should match `oxlint` in `package.json`. Update both together. For more,
see `notes.md` in the project root.

## Docker

The image builds the app and serves it with nginx. Build it from the **project root**, because it needs the `openapi`
package too:

```bash
docker build -f frontend/Dockerfile -t todo-frontend:1.0.0 .
docker run --rm -p 22112:80 -e BACKEND_ORIGIN=http://host.docker.internal:22111 todo-frontend:1.0.0
```

The app then runs on <http://localhost:22112>.

`BACKEND_ORIGIN` tells nginx where the backend is. You set it when you start the container, not when you build it. The
default is `http://host.docker.internal:22111`, which is a backend running on your own machine.

To run the whole app (PostgreSQL, backend and frontend) in containers, use `docker compose up --build` from the project
root.
