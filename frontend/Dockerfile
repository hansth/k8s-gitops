####
# Builds and serves the static production frontend.
#
# This is an npm workspace member (depends on @hansterhorst/openapi, see ../openapi/),
# so it must be built with the REPO ROOT as build context, not this directory:
#
# docker build -f frontend/Dockerfile -t todo-frontend .
#
# Then run it with:
#
# docker run -i --rm -p 8080:80 todo-frontend
#
# The container serves the built static assets and reverse-proxies /api to the
# backend server-side, so the browser only ever talks same-origin — no CORS, and
# nothing backend-specific is baked into the JS bundle. Point it at a reachable
# backend via the BACKEND_ORIGIN env var at *run* time (defaults to
# http://host.docker.internal:8080, i.e. a backend container publishing 8080 on
# the host):
#
# docker build -f frontend/Dockerfile -t todo-frontend .
# docker run -i --rm -p 5173:80 -e BACKEND_ORIGIN=http://host.docker.internal:8080 todo-frontend:1.0
###
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json ./
COPY openapi/package.json openapi/
COPY frontend/package.json frontend/
# Deliberately NOT copying package-lock.json / using `npm ci` here: the committed lockfile
# is generated on macOS and its optionalDependencies resolution doesn't include Linux
# platform-specific native bindings (e.g. vite's rolldown) at all — npm silently skips
# them against that lockfile (a known npm bug: npm/cli#4828) regardless of `ci` vs
# `install`. A lockfile-free `npm install` resolves fresh for whatever platform is
# actually running, trading exact-version-pinned Docker builds for one that works.
RUN npm install --no-package-lock

COPY openapi/ openapi/
COPY frontend/ frontend/
RUN npm run build --workspace=frontend

FROM nginx:1.27-alpine AS runtime
ENV BACKEND_ORIGIN=http://host.docker.internal:22111
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80