/**
 * 메인(마케팅·로그인) 사이트 — Vercel 배포.
 * 공용 계약/클라이언트(@totem/shared)는 TS 소스 그대로 가져오므로 transpile 대상에 넣는다.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@totem/shared"],
};

export default nextConfig;
