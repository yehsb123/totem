"use client";

import { loginRequest, passwordSchema, signupRequest } from "@totem/shared";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { errorMessage, redirectToConsole } from "@/lib/handoff";
import FindEmailStep from "./FindEmailStep";
import LoginStep from "./LoginStep";
import SignupStepComplete from "./SignupStepComplete";
import SignupStepEmail from "./SignupStepEmail";
import SignupStepInfo, { type SignupInfo } from "./SignupStepInfo";
import SignupStepTerms, { type Agreements } from "./SignupStepTerms";
import { KakaoLoginButton } from "./kakao";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export type AuthMode = "login" | "signup";

type View = "login" | "findEmail" | "signup-email" | "signup-info" | "signup-terms" | "signup-complete";

interface AuthModalProps {
  initialMode: AuthMode;
  /** 로그인 후 돌아갈 콘솔 경로 (검증은 handoff 에서 한 번 더) */
  next: string | null;
  onClose: () => void;
}

const EMPTY_INFO: SignupInfo = { companyName: "", name: "", password: "", confirmPassword: "", phone: "" };
const EMPTY_AGREEMENTS: Agreements = { terms: false, privacy: false, marketing: false };

/** zod 검증 실패 시 첫 번째 메시지 */
function firstIssue(result: { success: false; error: { issues: { message: string }[] } }): string {
  return result.error.issues[0]?.message ?? "입력값을 확인해주세요.";
}

export default function AuthModal({ initialMode, next, onClose }: AuthModalProps) {
  const [view, setView] = useState<View>(initialMode === "login" ? "login" : "signup-email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState<SignupInfo>(EMPTY_INFO);
  const [agreements, setAgreements] = useState<Agreements>(EMPTY_AGREEMENTS);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC 로 닫기 + Tab 은 모달 안에서만 + 배경 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      const dialog = dialogRef.current;
      if (e.key !== "Tab" || !dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const [first, last] = [items[0], items[items.length - 1]];
      const inside = dialog.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // 닫히면 모달을 연 버튼(로그인·시작하기)으로 포커스를 되돌린다
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLInputElement>("input:not([disabled])")?.focus();
  }, [view]);

  const go = (v: View) => {
    setMessage(null);
    setView(v);
  };

  const goToConsole = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await redirectToConsole(next);
      // 페이지가 이동하는 동안 로딩 상태를 유지한다
    } catch (e) {
      setMessage(errorMessage(e, "콘솔로 이동하지 못했습니다. 잠시 후 다시 시도해주세요."));
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const parsed = loginRequest.safeParse({ email, password });
    if (!parsed.success) {
      setMessage(firstIssue(parsed));
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await api.auth.login(parsed.data);
    } catch (e) {
      setMessage(errorMessage(e));
      setIsLoading(false);
      return;
    }
    await goToConsole();
  };

  const handleEmailNext = async () => {
    const parsed = signupRequest.shape.email.safeParse(email);
    if (!parsed.success) {
      setMessage(firstIssue(parsed));
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const { available } = await api.auth.emailCheck({ email: parsed.data });
      if (!available) {
        setMessage("이미 가입된 이메일입니다. 로그인해주세요.");
        return;
      }
      setEmail(parsed.data);
      go("signup-info");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  const phoneOrUndefined = () => (info.phone.trim() ? info.phone.trim() : undefined);

  const handleInfoNext = () => {
    const base = signupRequest
      .pick({ companyName: true, name: true, phone: true })
      .safeParse({ companyName: info.companyName, name: info.name, phone: phoneOrUndefined() });
    if (!base.success) {
      setMessage(firstIssue(base));
      return;
    }
    const pw = passwordSchema.safeParse(info.password);
    if (!pw.success) {
      setMessage(firstIssue(pw));
      return;
    }
    if (info.password !== info.confirmPassword) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }
    go("signup-terms");
  };

  const handleSignup = async () => {
    const parsed = signupRequest.safeParse({
      email,
      password: info.password,
      name: info.name,
      companyName: info.companyName,
      phone: phoneOrUndefined(),
      agreements,
    });
    if (!parsed.success) {
      setMessage(firstIssue(parsed));
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await api.auth.signup(parsed.data);
      go("signup-complete");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  const kakao = <KakaoLoginButton next={next} />;

  const renderView = () => {
    switch (view) {
      case "login":
        return (
          <LoginStep
            email={email}
            password={password}
            isLoading={isLoading}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={() => void handleLogin()}
            onSwitchToSignup={() => {
              setPassword("");
              go("signup-email");
            }}
            onFindEmail={() => go("findEmail")}
            extra={kakao}
          />
        );
      case "findEmail":
        return <FindEmailStep onBackToLogin={() => go("login")} />;
      case "signup-email":
        return (
          <SignupStepEmail
            email={email}
            isLoading={isLoading}
            onEmailChange={setEmail}
            onSubmit={() => void handleEmailNext()}
            onSwitchToLogin={() => go("login")}
            extra={kakao}
          />
        );
      case "signup-info":
        return (
          <SignupStepInfo
            email={email}
            info={info}
            onChange={(patch) => setInfo((prev) => ({ ...prev, ...patch }))}
            onSubmit={handleInfoNext}
            onBack={() => go("signup-email")}
          />
        );
      case "signup-terms":
        return (
          <SignupStepTerms
            agreements={agreements}
            isLoading={isLoading}
            onChange={setAgreements}
            onSubmit={() => void handleSignup()}
            onBack={() => go("signup-info")}
          />
        );
      case "signup-complete":
        return <SignupStepComplete name={info.name.trim()} isLoading={isLoading} onStart={() => void goToConsole()} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative flex max-h-[90vh] w-full max-w-[400px] flex-col items-center overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
        <div className="mb-4 flex items-center justify-center gap-1.5 text-xl font-bold text-slate-900">
          <Image src="/totem-logo.png" alt="" width={22} height={22} />
          ToTem
        </div>

        {message && (
          <p role="alert" className="mb-4 w-full rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600">
            {message}
          </p>
        )}

        {renderView()}
      </div>
    </div>
  );
}
