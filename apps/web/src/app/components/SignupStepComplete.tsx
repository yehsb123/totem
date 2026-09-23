"use client";

import Image from "next/image";
import StepIndicator from "./StepIndicator";

interface SignupStepCompleteProps {
  step: number;
  onStart: () => void;
}

export default function SignupStepComplete({
  step,
  onStart,
}: SignupStepCompleteProps) {
  return (
    <>
      <StepIndicator currentStep={step} />
      <div className="text-center mt-10 text-black">
        <div className="flex items-center justify-center gap-2 mb-5">
          <Image src="/totem-logo.png" alt="ToTem" width={40} height={40} />
          <span className="text-[32px] font-extrabold text-gray-900">
            ToTem
          </span>
        </div>
        <h3 className="mt-0 text-base font-bold">가입 완료!</h3>
        <p className="text-sm text-gray-500 my-3 mb-6">
          ToTem 서비스를 시작해보세요
        </p>
        <button
          onClick={onStart}
          className="w-full p-3 rounded-lg text-[15px] font-medium text-white border-none cursor-pointer transition-colors duration-200 bg-indigo-600 hover:bg-indigo-700"
        >
          ToTem 시작하기
        </button>
      </div>
    </>
  );
}
