"use client";

import Image from "next/image";
import StepIndicator from "./StepIndicator";
import { primaryButtonClass } from "./ui";

interface SignupStepCompleteProps {
  name: string;
  isLoading: boolean;
  onStart: () => void;
}

export default function SignupStepComplete({ name, isLoading, onStart }: SignupStepCompleteProps) {
  return (
    <div className="flex w-full flex-col">
      <StepIndicator currentStep={3} />
      <div className="mt-6 text-center text-slate-900">
        <div className="mb-5 flex items-center justify-center gap-2">
          <Image src="/totem-logo.png" alt="" width={40} height={40} />
          <span className="text-3xl font-extrabold tracking-tight">ToTem</span>
        </div>
        <h3 id="auth-modal-title" className="text-base font-bold">
          가입 완료!
        </h3>
        <p className="mb-6 mt-3 text-sm text-slate-500">
          {name ? `${name}님, ` : ""}ToTem 서비스를 시작해보세요
        </p>
        <button type="button" onClick={onStart} disabled={isLoading} className={primaryButtonClass}>
          {isLoading ? "콘솔로 이동 중..." : "ToTem 시작하기"}
        </button>
      </div>
    </div>
  );
}
