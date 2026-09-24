import { describeApiError, sanitizeNext } from "@totem/shared";
import { api } from "./api";
import { env } from "./env";

/** 콘솔이 넘겨준 `next` 검증 — 구현은 @totem/shared (콘솔과 같은 규칙) */
export { sanitizeNext };

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

/** 화면에 보여줄 오류 문구 — 콘솔과 같은 규칙(서버 오류면 오류 ID 덧붙임) */
export const errorMessage = describeApiError;
