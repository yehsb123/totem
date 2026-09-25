import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { KAKAO_LOGIN_SCRIPT_SRC, buildCsp } from "@totem/shared/csp";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 메인(마케팅·로그인) 사이트 — Vercel 배포.
 * 공용 계약/클라이언트(@totem/shared)는 TS 소스 그대로 가져오므로 transpile 대상에 넣는다.
 */
/**
 * 운영 빌드에만 CSP·보안 헤더 (docs/SECURITY.md R2). 개발 서버는 HMR 이 eval·웹소켓을 써서 제외.
 * API 주소는 빌드 시점 NEXT_PUBLIC_API_BASE_URL — Vercel 환경변수와 같은 값이어야 로그인이 된다.
 */
const isProd = process.env.NODE_ENV === "production";

/**
 * Vercel 빌드에서 필수 공개 변수가 없거나 https 가 아니면 빌드를 멈춘다.
 * 없으면 코드 기본값(localhost)이 번들·CSP 에 그대로 박혀, 배포는 성공하는데 사용자의 로그인이 전부 실패한다 (AUDIT §21).
 * (CI·로컬 빌드는 VERCEL 이 없어 기본값으로 빌드된다)
 */
if (process.env.VERCEL) {
  const problems = ["NEXT_PUBLIC_API_BASE_URL", "NEXT_PUBLIC_CONSOLE_URL"].flatMap((name) => {
    const v = process.env[name]?.trim();
    if (!v) return [`${name} 가 없습니다`];
    return v.startsWith("https://") ? [] : [`${name} 는 https:// 로 시작해야 합니다 (지금: ${v})`];
  });
  if (problems.length) throw new Error(`[vercel] 환경변수 확인 필요 — docs/DEPLOY.md 2절\n- ${problems.join("\n- ")}`);
}

const csp = buildCsp({
  apiOrigin: process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000",
  scriptSrc: KAKAO_LOGIN_SCRIPT_SRC,
  // 튜토리얼 영상 자리 (resources/tutorial) — 영상이 들어가면 쓰는 출처
  frameSrc: ["https://www.youtube-nocookie.com"],
});
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@totem/shared"],
  // next dev 와 next build 가 같은 .next 를 쓰면 개발 서버가 떠 있는 동안 빌드할 때 청크가 지워진다
  // (Vercel 빌드는 production 이라 기본 .next 를 그대로 쓴다)
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // 모노레포 루트(npm workspaces lockfile 위치)를 명시 — 상위 폴더의 다른 lockfile 을 루트로 오인하지 않게
  outputFileTracingRoot: join(__dirname, "../.."),
  async headers() {
    return isProd ? [{ source: "/:path*", headers: securityHeaders }] : [];
  },
};

export default nextConfig;
