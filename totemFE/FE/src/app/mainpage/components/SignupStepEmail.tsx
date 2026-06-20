"use client";

import StepIndicator from "./StepIndicator";

interface SignupStepEmailProps {
  step: number;
  email: string;
  onEmailChange: (value: string) => void;
  onNext: () => void;
  onSetMessage: (msg: string) => void;
}

export default function SignupStepEmail({
  step,
  email,
  onEmailChange,
  onNext,
  onSetMessage,
}: SignupStepEmailProps) {
  const handleNext = () => {
    if (!email.trim()) {
      onSetMessage("이메일을 입력해주세요.");
      return;
    }
    onNext();
  };

  return (
    <>
      <StepIndicator currentStep={step} />
      <p className="text-[15px] mb-5 text-black leading-relaxed text-center">
        별도의 설치과정 없이도 <br /> 모든 기능을 무료로 체험할 수 있습니다
      </p>
      <input
        type="email"
        placeholder="업무용 이메일을 입력해주세요"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        className="w-full p-3 border-[1.5px] border-indigo-500 rounded-lg text-sm text-black outline-none bg-white mb-4"
      />
      <button
        onClick={handleNext}
        className="w-full p-3 rounded-lg text-[15px] font-medium text-white border-none cursor-pointer transition-colors duration-200 bg-indigo-600 hover:bg-indigo-700"
      >
        다음 단계로 →
      </button>
    </>
  );
}
