"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { kakaoRedirectUri } from "@/components/auth/kakao";
import { api } from "@/lib/api";
import { errorMessage, redirectToConsole, sanitizeNext } from "@/lib/handoff";

/**
 * 카카오 인가 후 돌아오는 화면.
 * ?code= 를 API 에 넘겨 로그인(없으면 가입)하고, handoff 코드로 콘솔에 이동한다.
 * state 에는 로그인 모달을 열 때의 next(콘솔 경로)가 실려 있다.
 */
export default function KakaoCallback() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const next = sanitizeNext(params.get("state"));
  const retryHref = next ? `/?login=1&next=${encodeURIComponent(next)}` : "/?login=1";
  const started = useRef(false);

  const kakaoError = params.get("error");
  const code = params.get("code");
  // URL 만 보고 바로 알 수 있는 실패 — 렌더 중에 계산한다 (effect 안에서 setState 하지 않음)
  const immediateError = kakaoError
    ? kakaoError === "access_denied"
      ? "카카오 로그인이 취소되었습니다."
      : params.get("error_description") || "카카오 로그인에 실패했습니다."
    : !code
      ? "카카오 인가 코드가 없습니다. 처음부터 다시 시도해주세요."
      : null;

  useEffect(() => {
    // React StrictMode 의 이중 실행으로 인가 코드를 두 번 쓰지 않도록 막는다 (인가 코드는 1회용)
    if (started.current || immediateError || !code) return;
    started.current = true;

    (async () => {
      try {
        await api.auth.kakao({ code, redirectUri: kakaoRedirectUri });
        await redirectToConsole(next);
      } catch (e) {
        setError(errorMessage(e, "카카오 로그인 중 오류가 발생했습니다."));
      }
    })();
  }, [code, immediateError, next]);

  const shownError = immediateError ?? error;
  if (shownError) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-900">로그인하지 못했습니다</h1>
        <p role="alert" className="mt-3 text-sm text-red-600">
          {shownError}
        </p>
        <Link
          href={retryHref}
          className="mt-8 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          다시 로그인하기
        </Link>
        <Link href="/" className="mt-3 block text-sm text-slate-500 hover:text-slate-800">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return <CallbackPending />;
}

export function CallbackPending() {
  return (
    <div className="flex flex-col items-center text-center" aria-live="polite">
      <span className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" aria-hidden />
      <p className="mt-4 text-sm text-slate-600">카카오 계정으로 로그인하는 중입니다...</p>
    </div>
  );
}
