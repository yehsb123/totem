import { ApiError, createApiClient, describeApiError } from "@totem/shared";
import { env } from "./env";

/** 로그인이 풀렸을 때 메인 사이트 로그인으로 보낸다 (돌아올 경로를 함께 넘김) */
export function redirectToLogin() {
  if (typeof window === "undefined") return;
  const back = window.location.pathname + window.location.search;
  // 메인 사이트는 다른 출처라 절대 주소로 이동 (Next 라우터 대상 아님)
  const url = new URL("/", env.webUrl);
  url.searchParams.set("login", "1");
  url.searchParams.set("next", back);
  window.location.assign(url.href);
}

export const api = createApiClient({
  baseUrl: env.apiBaseUrl,
  onUnauthorized: redirectToLogin,
});

/** 화면에 보여줄 오류 문구 */
export const errorMessage = describeApiError;

/** 서버가 준 필드별 검증 오류 → { 필드경로: 메시지 } */
export function fieldErrors(e: unknown): Record<string, string> {
  if (!(e instanceof ApiError)) return {};
  const fields = (e.details as { fields?: { path: string; message: string }[] } | undefined)?.fields ?? [];
  return Object.fromEntries(fields.map((f) => [f.path, f.message]));
}
