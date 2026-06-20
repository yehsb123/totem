"use client";

const STEPS = ["이메일", "계정정보", "약관동의", "완료"];

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex justify-between mb-6 text-sm w-full">
      {STEPS.map((label, idx) => (
        <span
          key={label}
          className={`flex-1 text-center ${
            currentStep === idx
              ? "font-bold text-indigo-600"
              : "font-normal text-gray-400"
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
