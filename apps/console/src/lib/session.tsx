"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserProfile } from "@totem/shared";
import { api, errorMessage, redirectToLogin } from "./api";
import { env } from "./env";

interface SessionValue {
  user: UserProfile;
  /** 설정 화면에서 프로필을 바꾼 뒤 헤더 등에 반영 */
  setUser: (u: UserProfile) => void;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * 콘솔 전체 인증 게이트. 토큰이 없거나 /users/me 가 실패하면 메인 사이트 로그인으로 보낸다.
 * (토큰 만료는 api 클라이언트가 refresh 를 시도하고, 그것도 실패하면 onUnauthorized 로 여기와 같은 곳으로 보낸다)
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api.isLoggedIn()) {
      redirectToLogin();
      return;
    }
    api.users
      .me()
      .then(setUser)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    window.location.href = env.webUrl;
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-700">
        <p>사용자 정보를 불러오지 못했습니다: {error}</p>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white" onClick={() => window.location.reload()}>
          다시 시도
        </button>
      </div>
    );
  }
  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">불러오는 중…</div>;
  }
  return <SessionContext.Provider value={{ user, setUser, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession 은 SessionProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}
