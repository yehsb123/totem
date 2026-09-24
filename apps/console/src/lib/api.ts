import { ApiError, createApiClient } from "@totem/shared";
import { env } from "./env";

/** 로그인이 풀렸을 때 메인 사이트 로그인으로 보낸다 (돌아올 경로를 함께 넘김) */
export function redirectToLogin() {
  if (typeof window === "undefined") return;
  const back = window.location.pathname + window.location.search;
  window.location.href = `${env.webUrl}/?login=1&next=${encodeURIComponent(back)}`;
}

export const api = createApiClient({
  baseUrl: env.apiBaseUrl,
  onUnauthorized: redirectToLogin,
});

/** 화면에 보여줄 오류 문구 */
export function errorMessage(e: unknown, fallback = "알 수 없는 오류가 발생했습니다."): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

/** 서버가 준 필드별 검증 오류 → { 필드경로: 메시지 } */
export function fieldErrors(e: unknown): Record<string, string> {
  if (!(e instanceof ApiError)) return {};
  const fields = (e.details as { fields?: { path: string; message: string }[] } | undefined)?.fields ?? [];
  return Object.fromEntries(fields.map((f) => [f.path, f.message]));
}
