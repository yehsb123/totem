"use client";

import StepIndicator from "./StepIndicator";

interface SignupStepInfoProps {
  step: number;
  email: string;
  company: string;
  username: string;
  password: string;
  confirmPassword: string;
  onCompanyChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onNext: () => void;
  onSetMessage: (msg: string) => void;
}

export default function SignupStepInfo({
  step,
  email,
  company,
  username,
  password,
  confirmPassword,
  onCompanyChange,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onNext,
  onSetMessage,
}: SignupStepInfoProps) {
  const handleNext = () => {
    if (!company || !username || !password || !confirmPassword) {
      onSetMessage("모든 정보를 입력해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      onSetMessage("비밀번호가 일치하지 않습니다.");
      return;
    }
    onNext();
  };

  const inputClass =
    "w-full p-3 border-[1.5px] border-indigo-500 rounded-lg text-sm text-black outline-none bg-white mb-2.5";

  return (
    <>
      <StepIndicator currentStep={step} />
      <h3 className="font-semibold mb-5 text-[15px] text-black">
        <strong>ToTem</strong>에 로그인할 계정을 만드세요
      </h3>
      <input
        type="text"
        value={email}
        disabled
        className={`${inputClass} bg-gray-100`}
      />
      <input
        type="text"
        placeholder="회사이름을 입력해주세요"
        value={company}
        onChange={(e) => onCompanyChange(e.target.value)}
        className={inputClass}
      />
      <input
        type="text"
        placeholder="사용자 이름을 입력해주세요"
        value={username}
        onChange={(e) => onUsernameChange(e.target.value)}
        className={inputClass}
      />
      <input
        type="password"
        placeholder="비밀번호를 입력해주세요"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        className={inputClass}
      />
      <input
        type="password"
        placeholder="비밀번호를 한번 더 입력해주세요"
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
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
