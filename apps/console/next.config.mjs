/**
 * 콘솔(로그인 후 기능 화면) — 정적 export 후 GitHub Pages 로 배포한다.
 * GitHub Pages 는 https://<user>.github.io/<repo>/ 하위 경로로 서비스되므로
 * basePath 를 NEXT_PUBLIC_BASE_PATH 로 주입한다 (로컬 개발은 빈 값).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  transpilePackages: ["@totem/shared"],
  images: { unoptimized: true },
};

export default nextConfig;
