/**
 * 로그인 후 돌아갈 내부 경로(`next`) 검증 — web·console 이 함께 쓰는 단일 구현 (오픈 리다이렉트 방지).
 * "/" 로 시작하고, "//"·"/\"(브라우저가 둘 다 다른 사이트 주소로 해석) 로 시작하지 않으며, 제어문자가 없는 경로만 허용.
 * (구 콘솔 구현은 "/\" 를 막지 않았다 — docs/AUDIT.md §10)
 */
export function sanitizeNext(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  for (let i = 0; i < value.length; i += 1) {
    const c = value.charCodeAt(i);
    if (c < 0x20 || c === 0x7f) return null;
  }
  return value;
}
