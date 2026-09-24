import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 메인(마케팅·로그인) 사이트 — Vercel 배포.
 * 공용 계약/클라이언트(@totem/shared)는 TS 소스 그대로 가져오므로 transpile 대상에 넣는다.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@totem/shared"],
  // next dev 와 next build 가 같은 .next 를 쓰면 개발 서버가 떠 있는 동안 빌드할 때 청크가 지워진다
  // (Vercel 빌드는 production 이라 기본 .next 를 그대로 쓴다)
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // 모노레포 루트(npm workspaces lockfile 위치)를 명시 — 상위 폴더의 다른 lockfile 을 루트로 오인하지 않게
  outputFileTracingRoot: join(__dirname, "../.."),
};

export default nextConfig;
