// @ts-check
/**
 * 프런트(web·console) 공통 Content-Security-Policy — docs/SECURITY.md R1·R2.
 *
 * 핵심은 connect-src: 브라우저가 데이터를 보낼 수 있는 곳을 자기 자신과 API 로만 제한한다.
 * 토큰이 localStorage 에 있으므로, XSS 가 생겨도 토큰을 외부 서버로 보내지 못하게 하는 마지막 방어선.
 *
 * 'unsafe-inline'(script): Next.js 정적 페이지는 인라인 부트스트랩 스크립트를 쓰고, 정적 export(GitHub Pages)는
 * 요청마다 nonce 를 만들 수 없어 불가피하다. 대신 외부 스크립트 출처는 필요한 곳(카카오)만 허용한다.
 *
 * plain JS(.mjs) 인 이유: next.config.mjs 에서 바로 import 해야 해서 (TS 소스는 불러올 수 없음).
 *
 * @param {{ apiOrigin: string; scriptSrc?: string[]; connectSrc?: string[]; frameSrc?: string[]; forMeta?: boolean }} opts
 *   forMeta: <meta> 로 넣을 때는 frame-ancestors 를 빼야 한다(메타에서는 무시되고 경고만 남음)
 * @returns {string}
 */
export function buildCsp({ apiOrigin, scriptSrc = [], connectSrc = [], frameSrc = [], forMeta = false }) {
  const origin = new URL(apiOrigin).origin;
  /** @type {[string, string[]][]} */
  const directives = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "'unsafe-inline'", ...scriptSrc]],
    ["style-src", ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"]],
    ["font-src", ["'self'", "data:", "https://cdn.jsdelivr.net"]],
    // TourAPI 이미지는 http 주소도 있고, 지도 타일은 여러 카카오 CDN 에서 온다 — 이미지는 데이터 유출 통로가 아니다
    ["img-src", ["'self'", "data:", "blob:", "https:", "http:"]],
    ["connect-src", ["'self'", origin, ...connectSrc]],
    ["frame-src", frameSrc.length ? frameSrc : ["'none'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ...(forMeta ? [] : /** @type {[string, string[]][]} */ ([["frame-ancestors", ["'none'"]]])),
  ];
  return directives.map(([k, v]) => `${k} ${[...new Set(v)].join(" ")}`).join("; ");
}

/** 카카오 스크립트 출처 */
export const KAKAO_LOGIN_SCRIPT_SRC = ["https://t1.kakaocdn.net"];
/** 카카오 지도 SDK 는 dapi.kakao.com 에서 로더를, t1.daumcdn.net 에서 본체를 불러온다 */
export const KAKAO_MAP_SCRIPT_SRC = ["https://dapi.kakao.com", "https://t1.daumcdn.net"];
