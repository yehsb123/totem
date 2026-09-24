/**
 * 공개 환경변수 (브라우저 번들에 그대로 들어간다 — 비밀값 금지).
 *
 * Next.js 는 `process.env.NEXT_PUBLIC_X` 처럼 **이름을 글자 그대로 쓴 접근만** 빌드 시 치환한다.
 * `process.env[name]` 같은 동적 접근은 브라우저에서 undefined 가 되므로 아래처럼 하나씩 적는다.
 */

function readUrl(name: string, raw: string | undefined, fallback: string): string {
  const value = raw?.trim() || fallback;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
  } catch {
    throw new Error(`[env] ${name} 값이 올바른 http(s) URL 이 아닙니다: "${value}"`);
  }
  // 끝의 / 는 제거해 `${base}/path` 로 이어 붙일 수 있게 한다
  return value.replace(/\/+$/, "");
}

export const env = {
  /** API 서버 주소 (API_PREFIX `/api/v1` 은 클라이언트가 붙인다) */
  apiBaseUrl: readUrl("NEXT_PUBLIC_API_BASE_URL", process.env.NEXT_PUBLIC_API_BASE_URL, "http://localhost:8000"),
  /** 로그인 후 이동할 콘솔(GitHub Pages) 주소 */
  consoleUrl: readUrl("NEXT_PUBLIC_CONSOLE_URL", process.env.NEXT_PUBLIC_CONSOLE_URL, "http://localhost:3200"),
  /** 이 사이트 자신의 주소 — 카카오 redirectUri, metadataBase 에 쓴다 */
  siteUrl: readUrl("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3100"),
  /** 카카오 JavaScript 키. 비어 있으면 카카오 로그인 버튼을 숨긴다 */
  kakaoJsKey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim() ?? "",
} as const;

export const isKakaoEnabled = env.kakaoJsKey.length > 0;
