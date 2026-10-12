# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare yarn@1.22.22 --activate
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive
COPY . .
ARG VITE_FRONTEND_URL
ARG VITE_API_BASE_URL
RUN VITE_FRONTEND_URL="$VITE_FRONTEND_URL" VITE_API_BASE_URL="$VITE_API_BASE_URL" yarn build

FROM nginx:stable-alpine AS runtime
COPY deployment/nginx.conf /etc/nginx/nginx.conf.template
COPY deployment/entrypoint.sh /usr/local/bin/retreat-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3   CMD wget -q -O /dev/null http://127.0.0.1:8082/healthz || exit 1
ENTRYPOINT ["/bin/sh", "/usr/local/bin/retreat-entrypoint.sh"]
