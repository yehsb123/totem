"use client";

import { ApiError } from "@totem/shared";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { api } from "@/lib/api";
import { redirectToConsole, sanitizeNext } from "@/lib/handoff";
import AuthModal, { type AuthMode } from "./AuthModal";
import { KakaoSdk } from "./kakao";

interface AuthContextValue {
  /** 브라우저에 토큰이 있는지 (첫 렌더(SSR)에서는 항상 false) */
  isLoggedIn: boolean;
  openAuth: (mode: AuthMode, next?: string | null) => void;
  /** "무료로 시작하기" — 로그인 상태면 콘솔로, 아니면 회원가입 모달 */
  start: () => void;
  /** 로그인 상태에서 콘솔로 이동. 세션이 만료됐으면 로그인 모달을 연다 */
  goToConsole: (next?: string | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** 같은 탭에서 토큰이 바뀐 것을 알리는 이벤트 (다른 탭은 storage 이벤트로 온다) */
const AUTH_EVENT = "totem:auth";
function subscribeAuth(onChange: () => void) {
  window.addEventListener(AUTH_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(AUTH_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
const notifyAuthChanged = () => window.dispatchEvent(new Event(AUTH_EVENT));

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 는 AuthProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<{ mode: AuthMode; next: string | null } | null>(null);
  // 로그인 여부의 출처는 localStorage(외부 저장소) — effect 로 복사하지 않고 구독한다.
  // 서버 렌더에서는 항상 false (hydration 불일치 방지)
  const isLoggedIn = useSyncExternalStore(subscribeAuth, () => api.isLoggedIn(), () => false);

  // 저장된 토큰이 아직 유효한지 한 번 확인 — 탈퇴·다른 기기에서 비밀번호 변경·세션 폐기 뒤에도
  // 토큰이 남아 헤더가 "로그인됨"으로 보이던 문제 (AUDIT §30). 서버가 거절(401·403)할 때만 비운다(네트워크 오류는 그대로)
  useEffect(() => {
    if (!api.isLoggedIn()) return;
    api.users.me().catch((e) => {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        api.tokens.clear();
        notifyAuthChanged();
      }
    });
  }, []);

  const openAuth = useCallback((mode: AuthMode, next?: string | null) => {
    setModal({ mode, next: sanitizeNext(next) });
  }, []);

  const closeAuth = useCallback(() => {
    setModal(null);
    notifyAuthChanged();
  }, []);

  const goToConsole = useCallback(
    async (next?: string | null) => {
      try {
        await redirectToConsole(next);
      } catch (e) {
        // 저장된 토큰이 만료·폐기된 경우: 비우고 다시 로그인
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          api.tokens.clear();
          notifyAuthChanged();
        }
        openAuth("login", next);
      }
    },
    [openAuth],
  );

  const start = useCallback(() => {
    if (api.isLoggedIn()) void goToConsole();
    else openAuth("signup");
  }, [goToConsole, openAuth]);

  const logout = useCallback(async () => {
    await api.auth.logout();
    notifyAuthChanged();
  }, []);

  const value = useMemo(
    () => ({ isLoggedIn, openAuth, start, goToConsole, logout }),
    [isLoggedIn, openAuth, start, goToConsole, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      <KakaoSdk />
      {children}
      {modal && <AuthModal initialMode={modal.mode} next={modal.next} onClose={closeAuth} />}
    </AuthContext.Provider>
  );
}
