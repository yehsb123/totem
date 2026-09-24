/**
 * 콘솔 환경변수. Next 는 `process.env.NEXT_PUBLIC_이름` 을 **빌드 시점에 글자 그대로** 치환하므로
 * 반드시 리터럴 이름으로 읽는다 (동적 키 접근 금지). 값은 번들에 공개되므로 비밀값을 넣지 않는다.
 * 설명·등록 위치: docs/ENV.md
 */
const trim = (v: string | undefined, fallback: string) => (v && v.trim() ? v.trim() : fallback).replace(/\/+$/, "");

export const env = {
  /** API 서버 주소 (끝 / 없이, /api/v1 은 클라이언트가 붙인다) */
  apiBaseUrl: trim(process.env.NEXT_PUBLIC_API_BASE_URL, "http://localhost:8000"),
  /** 메인(마케팅·로그인) 사이트 — 로그인 안 된 사용자를 보내는 곳 */
  webUrl: trim(process.env.NEXT_PUBLIC_WEB_URL, "http://localhost:3100"),
  /** GitHub Pages 하위 경로 (예: /totem). 로컬은 빈 값 */
  basePath: trim(process.env.NEXT_PUBLIC_BASE_PATH, ""),
  /** 카카오 지도 JavaScript 키 (도메인 제한으로 보호되는 공개 키) */
  kakaoMapAppKey: (process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? "").trim(),
} as const;

/** public/ 파일 경로에 basePath 를 붙인다 (next/image unoptimized·<img> 는 자동으로 안 붙음) */
export const asset = (path: string) => `${env.basePath}${path.startsWith("/") ? path : `/${path}`}`;
