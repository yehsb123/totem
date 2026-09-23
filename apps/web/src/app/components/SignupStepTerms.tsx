"use client";

import StepIndicator from "./StepIndicator";

interface SignupStepTermsProps {
  step: number;
  agree1: boolean;
  agree2: boolean;
  agree3: boolean;
  isLoading: boolean;
  onToggleAgree1: () => void;
  onToggleAgree2: () => void;
  onToggleAgree3: () => void;
  onSignup: () => void;
}

export default function SignupStepTerms({
  step,
  agree1,
  agree2,
  agree3,
  isLoading,
  onToggleAgree1,
  onToggleAgree2,
  onToggleAgree3,
  onSignup,
}: SignupStepTermsProps) {
  const allAgreed = agree1 && agree2 && agree3;

  return (
    <>
      <StepIndicator currentStep={step} />
      <h3 className="font-semibold mb-5 text-[15px] text-black">
        <strong>ToTem</strong> 이용을 위한 약관에 동의해주세요
      </h3>
      <label className="text-black text-sm block mb-2">
        <input
          type="checkbox"
          checked={agree1}
          onChange={onToggleAgree1}
          className="mr-2"
        />{" "}
        만 14세 이상입니다. (필수)
      </label>
      <label className="text-black text-sm block mb-2">
        <input
          type="checkbox"
          checked={agree2}
          onChange={onToggleAgree2}
          className="mr-2"
        />{" "}
        이용약관 동의 (필수)
      </label>
      <label className="text-black text-sm block mb-2">
        <input
          type="checkbox"
          checked={agree3}
          onChange={onToggleAgree3}
          className="mr-2"
        />{" "}
        개인정보처리방침 동의 (필수)
      </label>
      <button
        onClick={onSignup}
        disabled={!allAgreed || isLoading}
        className={`w-full p-3 rounded-lg text-[15px] font-medium text-white border-none mt-5 transition-colors duration-200 ${
          allAgreed && !isLoading
            ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            : "bg-gray-300 cursor-not-allowed"
        }`}
      >
        {isLoading ? "가입 중..." : "가입하기"}
      </button>
    </>
  );
}
