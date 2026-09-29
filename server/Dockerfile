# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Multi-stage build.
#
# Stages exist so that build tooling never reaches the runtime image: the
# TypeScript compiler, dev dependencies and source are all left behind, which
# shrinks the image and removes them as attack surface.
#
# `argon2` has a native addon, so the build stage needs python3/make/g++. That
# is exactly the sort of thing that must not ship to production.
# ---------------------------------------------------------------------------

ARG NODE_VERSION=22.12.0-alpine3.20

# --- Stage 1: dependencies -------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

RUN apk add --no-cache python3 make g++

# Copied alone so this layer is cached until the manifests change — the
# expensive step does not rerun on every source edit.
COPY package.json package-lock.json* ./

# `npm ci` installs exactly the lockfile, which is what makes a build
# reproducible. `npm install` may silently resolve different versions.
RUN npm ci --include=dev

# --- Stage 2: build --------------------------------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Drop dev dependencies from the tree that will be copied forward.
RUN npm prune --omit=dev

# --- Stage 3: runtime ------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Keeps npm from writing into the image at runtime.
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# tini reaps zombies and forwards SIGTERM to node, so `enableShutdownHooks`
# actually fires. PID 1 in a container does not get that behaviour for free.
RUN apk add --no-cache tini curl

# The `node` user ships with the image (uid 1000). Running as root in a
# container means a container escape starts with root on the host.
USER node

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json

EXPOSE 4000

# Compose and standalone Docker use this; Kubernetes uses its own probes
# against the same endpoints and ignores HEALTHCHECK.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT:-4000}/health/ready || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
