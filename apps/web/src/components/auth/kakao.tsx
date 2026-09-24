"use client";

import Image from "next/image";
import Script from "next/script";
import { useState } from "react";
import { env, isKakaoEnabled } from "@/lib/env";
import { sanitizeNext } from "@/lib/handoff";

export const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
export const kakaoRedirectUri = `${env.siteUrl}/auth/kakao/callback`;

function initKakao(): boolean {
  const kakao = window.Kakao;
  if (!kakao) return false;
  if (!kakao.isInitialized()) kakao.init(env.kakaoJsKey);
  return kakao.isInitialized();
}

/** 카카오 JS SDK 로더. NEXT_PUBLIC_KAKAO_JS_KEY 가 비어 있으면 아무것도 불러오지 않는다 */
export function KakaoSdk() {
  if (!isKakaoEnabled) return null;
  return <Script src={KAKAO_SDK_URL} strategy="afterInteractive" crossOrigin="anonymous" onLoad={initKakao} />;
}

/**
 * 카카오로 시작하기 버튼. 인가 후 /auth/kakao/callback 으로 돌아오며,
 * 콘솔이 넘겨준 next 경로는 state 파라미터로 실어 보낸다.
 */
export function KakaoLoginButton({ next }: { next?: string | null }) {
  const [error, setError] = useState<string | null>(null);
  if (!isKakaoEnabled) return null;

  const handleClick = () => {
    setError(null);
    if (!initKakao()) {
      setError("카카오 로그인을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    const state = sanitizeNext(next) ?? undefined;
    window.Kakao!.Auth.authorize({ redirectUri: kakaoRedirectUri, state });
  };

  return (
    <div className="mt-4 w-full">
      <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        또는
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center justify-center overflow-hidden rounded-lg bg-[#FEE500] transition hover:brightness-95"
        aria-label="카카오로 시작하기"
      >
        <Image src="/kakao-login.png" alt="" width={183} height={45} className="h-[45px] w-auto" />
      </button>
      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
