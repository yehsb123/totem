"use client";

import StepIndicator from "./StepIndicator";
import { primaryButtonClass } from "./ui";

export interface Agreements {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
}

interface SignupStepTermsProps {
  agreements: Agreements;
  isLoading: boolean;
  onChange: (next: Agreements) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const ITEMS: { key: keyof Agreements; label: string; required: boolean }[] = [
  { key: "terms", label: "만 14세 이상이며, 이용약관에 동의합니다.", required: true },
  { key: "privacy", label: "개인정보 수집 및 이용에 동의합니다.", required: true },
  { key: "marketing", label: "이벤트·신규 기능 안내 등 마케팅 정보 수신에 동의합니다.", required: false },
];

export default function SignupStepTerms({ agreements, isLoading, onChange, onSubmit, onBack }: SignupStepTermsProps) {
  const allChecked = agreements.terms && agreements.privacy && agreements.marketing;
  const requiredChecked = agreements.terms && agreements.privacy;

  return (
    <form
      className="flex w-full flex-col"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <StepIndicator currentStep={2} />
      <h3 id="auth-modal-title" className="mb-5 text-center text-[15px] font-semibold text-slate-900">
        <strong>ToTem</strong> 이용을 위한 약관에 동의해주세요
      </h3>

      <label className="mb-3 flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-900">
        <input
          type="checkbox"
          className="size-4 accent-indigo-600"
          checked={allChecked}
          onChange={(e) => {
            const v = e.target.checked;
            onChange({ terms: v, privacy: v, marketing: v });
          }}
        />
        전체 동의
      </label>

      <div className="flex flex-col gap-2.5 px-1">
        {ITEMS.map((item) => (
          <label key={item.key} className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-indigo-600"
              checked={agreements[item.key]}
              onChange={(e) => onChange({ ...agreements, [item.key]: e.target.checked })}
            />
            <span>
              <span className={item.required ? "font-medium text-indigo-600" : "text-slate-500"}>
                ({item.required ? "필수" : "선택"})
              </span>{" "}
              {item.label}
            </span>
          </label>
        ))}
      </div>

      <button type="submit" disabled={!requiredChecked || isLoading} className={`${primaryButtonClass} mt-6`}>
        {isLoading ? "가입 중..." : "가입하기"}
      </button>
      <button type="button" onClick={onBack} className="mt-3 text-sm text-slate-500 hover:text-slate-800">
        ← 이전 단계
      </button>
    </form>
  );
}
