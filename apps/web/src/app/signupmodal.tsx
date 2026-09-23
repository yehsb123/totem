"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import LoginStep from "./components/LoginStep";
import SignupStepEmail from "./components/SignupStepEmail";
import SignupStepInfo from "./components/SignupStepInfo";
import SignupStepTerms from "./components/SignupStepTerms";
import SignupStepComplete from "./components/SignupStepComplete";
import { loginUser, registerUser } from "./authApi";

interface Props {
  onClose: () => void;
  initialStep?: number;
}

export default function SignupModal({ onClose, initialStep }: Props) {
  const router = useRouter();

  const [step, setStep] = useState<number>(initialStep ?? 0);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [agree3, setAgree3] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("userAccessToken", data.accessToken);
      localStorage.setItem("userRefreshToken", data.refreshToken);
      setMessage("로그인에 성공했습니다.");
      router.push("/toolpage/schedule");
      onClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message || "알 수 없는 오류가 발생했습니다.");
      } else {
        setMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!username || !email || !password || !(agree1 && agree2 && agree3)) {
      setMessage("모든 필수 정보를 입력하고 약관에 동의해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await registerUser({ name: username, email, password, companyName: company });
      setMessage("회원가입이 완료되었습니다.");
      setStep(3);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message || "오류가 발생했습니다.");
      } else {
        setMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    // Login mode: initialStep === 1
    if (step === 1 && initialStep === 1) {
      return (
        <LoginStep
          email={email}
          password={password}
          isLoading={isLoading}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onLogin={handleLogin}
          onSwitchToSignup={() => {
            setStep(0);
            setEmail("");
            setPassword("");
            setMessage(null);
          }}
        />
      );
    }

    switch (step) {
      case 0:
        return (
          <SignupStepEmail
            step={step}
            email={email}
            onEmailChange={setEmail}
            onNext={() => { setMessage(null); setStep(1); }}
            onSetMessage={setMessage}
          />
        );
      case 1:
        return (
          <SignupStepInfo
            step={step}
            email={email}
            company={company}
            username={username}
            password={password}
            confirmPassword={confirmPassword}
            onCompanyChange={setCompany}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onNext={() => { setMessage(null); setStep(2); }}
            onSetMessage={setMessage}
          />
        );
      case 2:
        return (
          <SignupStepTerms
            step={step}
            agree1={agree1}
            agree2={agree2}
            agree3={agree3}
            isLoading={isLoading}
            onToggleAgree1={() => setAgree1(!agree1)}
            onToggleAgree2={() => setAgree2(!agree2)}
            onToggleAgree3={() => setAgree3(!agree3)}
            onSignup={handleSignup}
          />
        );
      case 3:
        return (
          <SignupStepComplete
            step={step}
            onStart={() => { onClose(); router.push("/toolpage/schedule"); }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/40 flex justify-center items-center z-[9999] font-[Inter,sans-serif]">
      <div className="bg-white p-8 rounded-2xl w-[90%] max-w-[400px] shadow-[0_8px_24px_rgba(0,0,0,0.2)] relative flex flex-col items-center max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl text-gray-400 bg-transparent border-none cursor-pointer"
        >
          ✕
        </button>
        <h2 className="font-bold text-xl flex items-center justify-center gap-1.5 mb-2.5 text-gray-900">
          <Image src="/totem-logo.png" alt="ToTem" width={20} height={20} />
          ToTem
        </h2>

        {message && (
          <div className="bg-red-100 text-red-500 py-2 px-4 rounded-lg mb-4 text-sm text-center w-full">
            {message}
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
}
