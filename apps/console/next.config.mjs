import { fileURLToPath } from "node:url";

/**
 * 콘솔(로그인 후 기능 화면) — 정적 export 후 GitHub Pages 로 배포한다.
 * GitHub Pages 는 https://<user>.github.io/<repo>/ 하위 경로로 서비스되므로
 * basePath 를 NEXT_PUBLIC_BASE_PATH 로 주입한다 (로컬 개발은 빈 값).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 모노레포 루트 기준으로 파일 추적 (상위 폴더의 다른 lockfile 을 루트로 오인하지 않게)
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  // next dev 와 next build 가 같은 .next 를 쓰면, 개발 서버가 떠 있는 동안 빌드할 때
  // 개발 서버의 청크가 지워져 화면이 멈춘다 → 개발 산출물은 별도 폴더
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  transpilePackages: ["@totem/shared"],
  images: { unoptimized: true },
};

export default nextConfig;
