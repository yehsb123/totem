"use client";

import type { ReactNode } from "react";
import { inputClass, linkButtonClass, primaryButtonClass } from "./ui";

interface LoginStepProps {
  email: string;
  password: string;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onSwitchToSignup: () => void;
  onFindEmail: () => void;
  /** 카카오 로그인 등 추가 로그인 수단 */
  extra?: ReactNode;
}

export default function LoginStep({
  email,
  password,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSwitchToSignup,
  onFindEmail,
  extra,
}: LoginStepProps) {
  return (
    <form
      className="flex w-full flex-col"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h3 id="auth-modal-title" className="mb-5 text-center text-[15px] font-semibold text-slate-900">
        <strong>ToTem</strong>에 로그인하세요
      </h3>
      <label className="sr-only" htmlFor="login-email">
        이메일
      </label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        placeholder="이메일을 입력해주세요"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        className={`${inputClass} mb-2.5`}
      />
      <label className="sr-only" htmlFor="login-password">
        비밀번호
      </label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        placeholder="비밀번호를 입력해주세요"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        className={`${inputClass} mb-4`}
      />
      <button type="submit" disabled={isLoading} className={primaryButtonClass}>
        {isLoading ? "로그인 중..." : "로그인"}
      </button>

      {extra}

      <div className="mt-5 flex items-center justify-center gap-3 text-sm text-slate-600">
        <button type="button" onClick={onFindEmail} className="hover:text-slate-900 hover:underline">
          아이디 찾기
        </button>
        <span aria-hidden className="text-slate-300">
          |
        </span>
        <span>
          계정이 없으신가요?{" "}
          <button type="button" onClick={onSwitchToSignup} className={linkButtonClass}>
            회원가입
          </button>
        </span>
      </div>
    </form>
  );
}
