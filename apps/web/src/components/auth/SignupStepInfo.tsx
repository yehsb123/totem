"use client";

import StepIndicator from "./StepIndicator";
import { inputClass, primaryButtonClass } from "./ui";

export interface SignupInfo {
  companyName: string;
  name: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

interface SignupStepInfoProps {
  email: string;
  info: SignupInfo;
  onChange: (patch: Partial<SignupInfo>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function SignupStepInfo({ email, info, onChange, onSubmit, onBack }: SignupStepInfoProps) {
  const field = `${inputClass} mb-2.5`;

  return (
    <form
      className="flex w-full flex-col"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <StepIndicator currentStep={1} />
      <h3 id="auth-modal-title" className="mb-5 text-center text-[15px] font-semibold text-slate-900">
        <strong>ToTem</strong>에 로그인할 계정을 만드세요
      </h3>
      <input type="email" value={email} disabled aria-label="이메일" className={field} />
      <input
        type="text"
        autoComplete="organization"
        aria-label="회사 이름"
        placeholder="회사 이름을 입력해주세요"
        value={info.companyName}
        onChange={(e) => onChange({ companyName: e.target.value })}
        className={field}
      />
      <input
        type="text"
        autoComplete="name"
        aria-label="사용자 이름"
        placeholder="사용자 이름을 입력해주세요"
        value={info.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className={field}
      />
      <input
        type="password"
        autoComplete="new-password"
        aria-label="비밀번호"
        placeholder="비밀번호 (영문·숫자 포함 8자 이상)"
        value={info.password}
        onChange={(e) => onChange({ password: e.target.value })}
        className={field}
      />
      <input
        type="password"
        autoComplete="new-password"
        aria-label="비밀번호 확인"
        placeholder="비밀번호를 한번 더 입력해주세요"
        value={info.confirmPassword}
        onChange={(e) => onChange({ confirmPassword: e.target.value })}
        className={field}
      />
      <input
        type="tel"
        autoComplete="tel"
        aria-label="전화번호 (선택)"
        placeholder="전화번호 (선택 · 아이디 찾기에 사용)"
        value={info.phone}
        onChange={(e) => onChange({ phone: e.target.value })}
        className={`${inputClass} mb-4`}
      />
      <button type="submit" className={primaryButtonClass}>
        다음 단계로 →
      </button>
      <button type="button" onClick={onBack} className="mt-3 text-sm text-slate-500 hover:text-slate-800">
        ← 이메일 다시 입력
      </button>
    </form>
  );
}
