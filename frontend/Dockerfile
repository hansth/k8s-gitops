####
#
# This is an npm workspace member (depends on @hansterhorst/openapi, see ../openapi/),
# so it must be built from the REPO ROOT as build context:
#
# docker build -f frontend/Dockerfile -t todo-frontend:1.0.0 .
#
# Then run the container with:
#
# docker run --rm -p 22112:80 \
#  -e BACKEND_ORIGIN=http://host.docker.internal:22111 \
#  todo-frontend:1.0.0
#
###

# BUILD STAGE
# Starts from the slim variant of the Node 24 image,
# the same major version as mise.toml and GitHub Actions.
FROM node:24-slim AS build

# Sets the working directory.
WORKDIR /app

# Copies only the `package.json` files, to optimize layer caching. If these files don't change,
# Docker reuses the cached `npm install` layer. The file structure with `./`, `openapi/`, and `frontend/`
# indicates an npm workspaces monorepo, where the root `package.json` declares workspace members.
COPY package.json ./
COPY openapi/package.json openapi/
COPY frontend/package.json frontend/

# Installs dependencies for all workspaces, and tells npm not to write or update a `package-lock.json`.
# Note this also means installs are not pinned to a lockfile, so versions come from the ranges in the manifests.
RUN npm install --no-package-lock

# Copies the actual source for both workspaces, after dependencies are installed.
# Changes to source code invalidate only these layers, not the install layer above.
COPY openapi/ openapi/
COPY frontend/ frontend/

# Runs the `build` script defined in `frontend/package.json`.
# This produces the compiled static assets, expected at `/app/frontend/dist`based on the copy in the next stage.
RUN npm run build --workspace=frontend

# RUN STAGE
# Run a small nginx image on Alpine. Nothing from the build stage carries over except what is explicitly copied.
FROM nginx:stable-alpine3.24 AS runtime

# Update the package index and upgrade all installed packages to their latest versions.
RUN apk upgrade --no-cache

# Sets a default environment variable for the backend address. `host.docker.internal` resolves to the host machine from inside the container.
ENV BACKEND_ORIGIN=http://host.docker.internal:22111

# Copy the nginx config template that runs `envsubst` on every `*.template` file in that directory at container start,
# substituting environment variables like `BACKEND_ORIGIN` and writing the result to `/etc/nginx/conf.d/`.
# And copy the built static assets from the `build` stage into nginx's default web root.
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Run the image as a non-root user and set directory group ownership to `root`.
# Nginx needs to write to its cache, config directory, and PID/socket directory.
# `g+rwX` permits read/write and execute on existing directories and executables.
RUN chown -R 1001:root /var/cache/nginx /etc/nginx/conf.d /var/run \
    && chmod -R g+rwX /var/cache/nginx /etc/nginx/conf.d /var/run

# Documents the port the app listens on.
EXPOSE 80

# Run the container as non-root user UID `1001` instead of root, so nginx runs unprivileged.
USER 1001
