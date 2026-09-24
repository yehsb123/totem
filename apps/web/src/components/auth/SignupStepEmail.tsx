"use client";

import type { ReactNode } from "react";
import StepIndicator from "./StepIndicator";
import { inputClass, linkButtonClass, primaryButtonClass } from "./ui";

interface SignupStepEmailProps {
  email: string;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onSwitchToLogin: () => void;
  extra?: ReactNode;
}

export default function SignupStepEmail({
  email,
  isLoading,
  onEmailChange,
  onSubmit,
  onSwitchToLogin,
  extra,
}: SignupStepEmailProps) {
  return (
    <form
      className="flex w-full flex-col"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <StepIndicator currentStep={0} />
      <p id="auth-modal-title" className="mb-5 text-center text-[15px] leading-relaxed text-slate-900">
        별도의 설치과정 없이도 <br /> 모든 기능을 무료로 체험할 수 있습니다
      </p>
      <label className="sr-only" htmlFor="signup-email">
        업무용 이메일
      </label>
      <input
        id="signup-email"
        type="email"
        autoComplete="email"
        placeholder="업무용 이메일을 입력해주세요"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        className={`${inputClass} mb-4`}
      />
      <button type="submit" disabled={isLoading} className={primaryButtonClass}>
        {isLoading ? "확인 중..." : "다음 단계로 →"}
      </button>

      {extra}

      <p className="mt-5 text-center text-sm text-slate-600">
        이미 계정이 있으신가요?{" "}
        <button type="button" onClick={onSwitchToLogin} className={linkButtonClass}>
          로그인
        </button>
      </p>
    </form>
  );
}
