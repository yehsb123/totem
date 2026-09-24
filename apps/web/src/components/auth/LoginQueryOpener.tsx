"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";

/**
 * 콘솔이 비로그인 사용자를 `/?login=1&next=<콘솔 경로>` 로 보내면 로그인 모달을 자동으로 연다.
 * useSearchParams 를 쓰므로 반드시 <Suspense> 안에서 렌더링한다 (정적 렌더링 유지).
 */
export default function LoginQueryOpener() {
  const params = useSearchParams();
  const { openAuth } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || params.get("login") !== "1") return;
    handled.current = true;
    openAuth("login", params.get("next"));
  }, [params, openAuth]);

  return null;
}
