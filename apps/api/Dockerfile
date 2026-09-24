# 모노레포 루트에서 빌드:  docker build -f apps/api/Dockerfile -t totem-api .
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm ci -w @totem/api -w @totem/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @totem/api

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/api/package.json ./
RUN npm install --omit=dev --no-package-lock && npm cache clean --force
COPY --from=build /repo/apps/api/dist ./dist
USER node
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:${PORT:-8000}/api/v1/health || exit 1
CMD ["node", "dist/server.js"]
