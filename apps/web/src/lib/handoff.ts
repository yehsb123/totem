import { ApiError } from "@totem/shared";
import { api } from "./api";
import { env } from "./env";

/**
 * 콘솔이 넘겨준 `next`(로그인 후 돌아갈 콘솔 내부 경로)를 검증한다.
 * 오픈 리다이렉트 방지: "/" 로 시작하고 "//" 나 "/\" 로 시작하지 않는 경로만 허용.
 */
export function sanitizeNext(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  // 제어문자 차단
  for (let i = 0; i < value.length; i += 1) {
    const c = value.charCodeAt(i);
    if (c < 0x20 || c === 0x7f) return null;
  }
  return value;
}

/** 핸드오프 코드로 콘솔 콜백 URL 을 만든다 */
export function buildConsoleCallbackUrl(code: string, next?: string | null): string {
  const params = new URLSearchParams({ code });
  const safeNext = sanitizeNext(next);
  if (safeNext) params.set("next", safeNext);
  return `${env.consoleUrl}/auth/callback/?${params.toString()}`;
}

/**
 * 로그인된 상태에서 1회용 코드를 받아 콘솔로 이동한다.
 * (web·console 은 도메인이 달라 localStorage 를 공유하지 못하므로 코드로 넘긴다)
 */
export async function redirectToConsole(next?: string | null): Promise<void> {
  const { code } = await api.auth.createHandoff();
  window.location.href = buildConsoleCallbackUrl(code, next);
}

/** 화면에 보여줄 오류 문구 */
export function errorMessage(error: unknown, fallback = "알 수 없는 오류가 발생했습니다."): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
