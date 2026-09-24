"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { env } from "@/lib/env";

/** 내부 경로만 허용 (//evil.com 같은 프로토콜 상대 주소로의 오픈 리다이렉트 방지) */
const safeNext = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") ? v : "/schedule/");

/**
 * 메인 사이트에서 로그인하면 ?code=<1회용 코드>&next=<경로> 로 이 페이지에 온다.
 * 코드를 토큰으로 바꿔 저장하고 원래 가려던 화면으로 보낸다. basePath 는 router 가 붙인다.
 */
function Callback() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode 에서 effect 가 두 번 돌아도 1회용 코드를 한 번만 쓴다
    if (started.current) return;
    started.current = true;
    const code = params.get("code");
    if (!code) {
      setError("로그인 정보가 없습니다.");
      return;
    }
    const next = safeNext(params.get("next"));
    api.auth
      .exchangeHandoff(code)
      .then(() => {
        const withoutBase = env.basePath && next.startsWith(env.basePath) ? next.slice(env.basePath.length) || "/" : next;
        router.replace(withoutBase);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [params, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-slate-600">
      {error ? (
        <>
          <p className="text-red-600">{error}</p>
          <a className="text-blue-600 underline" href={`${env.webUrl}/?login=1`}>
            다시 로그인하기
          </a>
        </>
      ) : (
        <p>로그인 처리 중…</p>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <Callback />
    </Suspense>
  );
}
