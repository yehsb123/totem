import { defineConfig } from "tsup";

// @totem/shared 는 TS 소스 패키지라 번들에 포함시킨다 (런타임에 별도 빌드 불필요)
export default defineConfig({
  entry: ["src/server.ts", "src/db/seed/run.ts", "src/db/purge-run.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  noExternal: ["@totem/shared"],
  // 개발·테스트 전용(운영은 MONGO_URI 필수) — 번들에서 제외
  external: ["mongodb-memory-server"],
});
