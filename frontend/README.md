# Todo Frontend

A small React + TypeScript UI for the [Todo backend](../backend/), built contract-first against the same [OpenAPI spec](../openapi/).

## Stack

- **React 19** + **TypeScript**, scaffolded with **Vite**
- **openapi-fetch** — thin, fully-typed fetch client generated from the OpenAPI contract (no hand-written request/response types)
- **oxlint** — linting (`npm run lint`)

## Architecture

```
@hansterhorst/openapi        (npm workspace package, types only — see ../openapi/README.md)
    │  paths, components generated from ../openapi/openapi.yaml
    ▼
src/api/client.ts             openapi-fetch client typed against `paths`
    │
    ▼
src/api/todos.ts              listTodos / createTodo / updateTodo / deleteTodo
    │
    ▼
src/App.tsx                   list, add, toggle-complete, inline-edit, delete
```

`App.tsx` never talks to `fetch` directly — every request goes through `src/api/todos.ts`, which is typed end-to-end against the shared spec via `@hansterhorst/openapi`. If the backend's contract changes, `tsc` fails here before you ever open a browser.

In dev, `vite.config.ts` proxies `/api/*` to `http://localhost:8080` (the backend), so the app calls same-origin relative paths and never hardcodes a backend URL.

## Running locally

This is an npm workspace member of the repo root — install from the **repo root**, not here:

```shell script
cd ..
npm install
```

Then, with the [backend](../backend/) running on `:8080`:

```shell script
npm run dev
```

`predev`/`prebuild` automatically regenerate `@hansterhorst/openapi`'s types (`npm --prefix ../openapi run generate`) before starting or building, so you don't need to run that by hand — see [`../openapi/README.md`](../openapi/README.md) if you want to understand or run that step directly.

- App: `http://localhost:5173`

## Other scripts

```shell script
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve the production build locally
npm run lint       # oxlint
```

## Container

`Dockerfile` builds and serves the production `dist/` via nginx. Because this is an npm workspace member (depends on `@hansterhorst/openapi`), it must be built from the **repo root** as context, not from here:

```shell script
cd ..
docker build -f frontend/Dockerfile -t todo-frontend .
docker run --rm -p 22112:80 -e BACKEND_ORIGIN=http://host.docker.internal:22111 todo-frontend:1.0
docker run --rm -p 22111:22111 --add-host=host.docker.internal:host-gateway -e DB_URL=jdbc:postgresql://host.docker.internal:5432/hansth -e DB_USERNAME=hansth -e DB_PASSWORD=password todo-backend-native:1.0
```

Like the Vite dev server, the container proxies `/api` — server-side, via nginx — so the browser only ever calls same-origin and nothing backend-specific is baked into the JS bundle. Point it at the backend with the `BACKEND_ORIGIN` env var at **run** time (defaults to `http://host.docker.internal:8080`, i.e. a backend container publishing `8080` on the host).