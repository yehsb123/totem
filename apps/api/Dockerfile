# 모노레포 루트에서 빌드:  docker build -f apps/api/Dockerfile -t totem-api .
#
# 1) build: 전체 의존성으로 dist 번들 생성 (@totem/shared 는 번들에 포함)
# 2) deps:  **워크스페이스 lockfile 로** 운영 의존성만 설치 — 버전이 lockfile 과 같다
#    (예전에는 api package.json 만으로 npm install 해서 ① devDependencies 의 @totem/shared(레지스트리에 없음)를
#     찾다가 404 로 빌드가 실패했고 ② lockfile 없이 ^ 범위라 빌드할 때마다 버전이 달라질 수 있었다 — AUDIT §19)
# 3) 실행 이미지: dist + 운영 node_modules 만
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm ci -w @totem/api -w @totem/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @totem/api

FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
# 워크스페이스 링크(@totem/*)는 실행에 필요 없고 이미지 안에서 끊긴 링크가 되므로 지운다
RUN npm ci --omit=dev -w @totem/api && rm -rf node_modules/@totem && npm cache clean --force

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/api/package.json ./
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
USER node
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:${PORT:-8000}/api/v1/health || exit 1
# 시드·정리는 같은 이미지로:  docker run --rm --env-file … totem-api node dist/db/seed/run.js   (또는 dist/db/purge-run.js)
CMD ["node", "dist/server.js"]
