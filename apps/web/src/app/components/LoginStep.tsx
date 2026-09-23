"use client";

interface LoginStepProps {
  email: string;
  password: string;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: () => void;
  onSwitchToSignup: () => void;
}

export default function LoginStep({
  email,
  password,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onSwitchToSignup,
}: LoginStepProps) {
  return (
    <>
      <h3 className="font-semibold mb-5 text-[15px] text-black">
        <strong>ToTem</strong>에 로그인하세요
      </h3>
      <input
        type="email"
        placeholder="이메일을 입력해주세요"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        className="w-full p-3 border-[1.5px] border-indigo-500 rounded-lg text-sm text-black outline-none bg-white mb-2.5"
      />
      <input
        type="password"
        placeholder="비밀번호를 입력해주세요"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        className="w-full p-3 border-[1.5px] border-indigo-500 rounded-lg text-sm text-black outline-none bg-white mb-4"
      />
      <button
        onClick={onLogin}
        disabled={isLoading}
        className={`w-full p-3 rounded-lg text-[15px] font-medium text-white border-none cursor-pointer transition-colors duration-200 ${
          isLoading ? "bg-gray-300" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {isLoading ? "로그인 중..." : "로그인"}
      </button>
      <div className="text-center mt-4 text-sm text-black">
        계정이 없으신가요?{" "}
        <button
          onClick={onSwitchToSignup}
          className="bg-transparent border-none text-indigo-600 font-semibold cursor-pointer p-0"
        >
          회원가입
        </button>
      </div>
    </>
  );
}
