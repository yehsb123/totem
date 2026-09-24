const STEPS = ["이메일", "계정정보", "약관동의", "완료"];

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="mb-6 flex w-full justify-between text-sm" aria-label="회원가입 단계">
      {STEPS.map((label, idx) => (
        <li
          key={label}
          aria-current={currentStep === idx ? "step" : undefined}
          className={`flex-1 text-center ${
            currentStep === idx ? "font-bold text-indigo-600" : idx < currentStep ? "text-slate-600" : "text-slate-400"
          }`}
        >
          {label}
        </li>
      ))}
    </ol>
  );
}
