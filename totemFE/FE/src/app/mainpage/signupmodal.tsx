"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";

// interface LoginResponse {
//   accessToken: string;
//   refreshToken: string;
// }

interface Props {
  onClose: () => void;
  initialStep?: number;
}

export default function SignupModal({ onClose, initialStep }: Props) {
  const router = useRouter();

  const [step, setStep] = useState<number>(
    initialStep !== undefined ? initialStep : 0
  );

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

  const allAgreed = agree1 && agree2 && agree3;

  const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1.5px solid #6366F1",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#000",
    outline: "none",
    backgroundColor: "#fff",
  };

  const buttonStyle = {
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    padding: "12px",
    width: "100%",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 500,
    cursor: "pointer" as const,
    transition: "background-color 0.2s ease-in-out",
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const StepIndicator = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "24px",
        fontSize: "14px",
        width: "100%",
      }}
    >
      <span
        style={{
          fontWeight: step === 0 ? 700 : 400,
          color: step === 0 ? "#4F46E5" : "#999",
          flex: 1,
          textAlign: "center",
        }}
      >
        이메일
      </span>
      <span
        style={{
          fontWeight: step === 1 ? 700 : 400,
          color: step === 1 ? "#4F46E5" : "#999",
          flex: 1,
          textAlign: "center",
        }}
      >
        계정정보
      </span>
      <span
        style={{
          fontWeight: step === 2 ? 700 : 400,
          color: step === 2 ? "#4F46E5" : "#999",
          flex: 1,
          textAlign: "center",
        }}
      >
        약관동의
      </span>
      <span
        style={{
          fontWeight: step === 3 ? 700 : 400,
          color: step === 3 ? "#4F46E5" : "#999",
          flex: 1,
          textAlign: "center",
        }}
      >
        완료
      </span>
    </div>
  );

  const renderStep0 = () => (
    <>
      <StepIndicator />
      <p
        style={{
          fontSize: "15px",
          marginBottom: "20px",
          color: "#000",
          lineHeight: 1.6,
          textAlign: "center",
        }}
      >
        별도의 설치과정 없이도 <br /> 모든 기능을 무료로 체험할 수 있습니다
      </p>
      <input
        type="email"
        placeholder="업무용 이메일을 입력해주세요"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ ...inputStyle, marginBottom: "16px" }}
      />
      <button
        onClick={() => {
          if (!email.trim()) {
            setMessage("이메일을 입력해주세요.");
            return;
          }
          setMessage(null);
          setStep(1);
        }}
        style={buttonStyle}
      >
        다음 단계로 →
      </button>
    </>
  );

  const renderStep1 = () => (
    <>
      <StepIndicator />

      {initialStep === 1 ? (
        <>
          <h3
            style={{
              fontWeight: 600,
              marginBottom: "20px",
              fontSize: "15px",
              color: "#000",
            }}
          >
            <strong>ToTem</strong>에 로그인하세요
          </h3>
          <input
            type="email"
            placeholder="이메일을 입력해주세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, marginBottom: "10px" }}
          />
          <input
            type="password"
            placeholder="비밀번호를 입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: "16px" }}
          />
          <button
            onClick={handleLogin}
            disabled={isLoading}
            style={{
              ...buttonStyle,
              backgroundColor: isLoading ? "#ccc" : "#4F46E5",
            }}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
          <div
            style={{
              textAlign: "center",
              marginTop: "16px",
              fontSize: "14px",
              color: "#000",
            }}
          >
            계정이 없으신가요?{" "}
            <button
              onClick={() => {
                setStep(0);
                setEmail("");
                setPassword("");
                setMessage(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#4F46E5",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              회원가입
            </button>
          </div>
        </>
      ) : (
        <>
          <h3
            style={{
              fontWeight: 600,
              marginBottom: "20px",
              fontSize: "15px",
              color: "#000",
            }}
          >
            <strong>ToTem</strong>에 로그인할 계정을 만드세요
          </h3>
          <input
            type="text"
            value={email}
            disabled
            style={{ ...inputStyle, marginBottom: "10px" }}
          />
          <input
            type="text"
            placeholder="회사이름을 입력해주세요"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{ ...inputStyle, marginBottom: "10px" }}
          />
          <input
            type="text"
            placeholder="사용자 이름을 입력해주세요"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ ...inputStyle, marginBottom: "10px" }}
          />
          <input
            type="password"
            placeholder="비밀번호를 입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: "10px" }}
          />
          <input
            type="password"
            placeholder="비밀번호를 한번 더 입력해주세요"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: "16px" }}
          />
          <button
            onClick={() => {
              if (!company || !username || !password || !confirmPassword) {
                setMessage("모든 정보를 입력해주세요.");
                return;
              }
              if (password !== confirmPassword) {
                setMessage("비밀번호가 일치하지 않습니다.");
                return;
              }
              setMessage(null);
              setStep(2);
            }}
            style={buttonStyle}
          >
            다음 단계로 →
          </button>
        </>
      )}
    </>
  );

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await axios.post(
        "http://localhost:8000/users/login",

        { email, password }
      );

      if (response.data && response.data.accessToken) {
        localStorage.setItem("userAccessToken", response.data.accessToken);
        localStorage.setItem("userRefreshToken", response.data.refreshToken);
        console.log("로그인 성공:", response.data);
        setMessage("로그인에 성공했습니다.");
        router.push("/toolpage/schedule");
        onClose();
      } else {
        setMessage("로그인 응답에 토큰 정보가 없습니다.");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 400) {
          setMessage("존재하지 않는 아이디거나, 잘못된 비밀번호입니다.");
        } else if (status === 401) {
          setMessage("잘못된 형식의 요청입니다.");
        } else {
          setMessage(
            error.response.data?.message || "알 수 없는 오류가 발생했습니다."
          );
        }
        console.error("로그인 실패:", error);
      } else {
        console.error("네트워크 오류:", error);
        setMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!username || !email || !password || !allAgreed) {
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
      const response = await axios.post(
        "http://localhost:8000/users/register",
        {
          name: username,
          email,
          password,
          companyName: company,
        }
      );

      if (response.status === 200) {
        setMessage("회원가입이 완료되었습니다.");
        setStep(3);
      } else {
        setMessage("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "오류가 발생했습니다.";
        console.error("회원가입 실패:", serverMessage);
        setMessage(serverMessage);
      } else {
        console.error("네트워크 오류:", error);
        setMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep2 = () => (
    <>
      <StepIndicator />
      <h3
        style={{
          fontWeight: 600,
          marginBottom: "20px",
          fontSize: "15px",
          color: "#000",
        }}
      >
        <strong>ToTem</strong> 이용을 위한 약관에 동의해주세요
      </h3>
      <label
        style={{
          color: "#000",
          fontSize: "14px",
          display: "block",
          marginBottom: "8px",
        }}
      >
        <input
          type="checkbox"
          checked={agree1}
          onChange={() => setAgree1(!agree1)}
          style={{ marginRight: "8px" }}
        />{" "}
        만 14세 이상입니다. (필수)
      </label>
      <label
        style={{
          color: "#000",
          fontSize: "14px",
          display: "block",
          marginBottom: "8px",
        }}
      >
        <input
          type="checkbox"
          checked={agree2}
          onChange={() => setAgree2(!agree2)}
          style={{ marginRight: "8px" }}
        />{" "}
        이용약관 동의 (필수)
      </label>
      <label
        style={{
          color: "#000",
          fontSize: "14px",
          display: "block",
          marginBottom: "8px",
        }}
      >
        <input
          type="checkbox"
          checked={agree3}
          onChange={() => setAgree3(!agree3)}
          style={{ marginRight: "8px" }}
        />{" "}
        개인정보처리방침 동의 (필수)
      </label>
      <button
        onClick={handleSignup}
        disabled={!allAgreed || isLoading}
        style={{
          ...buttonStyle,
          backgroundColor: allAgreed && !isLoading ? "#4F46E5" : "#ccc",
          cursor: allAgreed && !isLoading ? "pointer" : "not-allowed",
          marginTop: "20px",
        }}
      >
        {isLoading ? "가입 중..." : "가입하기"}
      </button>
    </>
  );

  const renderStep3 = () => (
    <>
      <StepIndicator />
      <div style={{ textAlign: "center", marginTop: "40px", color: "#000" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <Image src="/TOTEM%20로고.png" alt="ToTem" width={40} height={40} />
          <span style={{ fontSize: "32px", fontWeight: 800, color: "#111" }}>
            ToTem
          </span>
        </div>

        <h3 style={{ marginTop: "0px", fontSize: "16px", fontWeight: 700 }}>
          가입 완료!
        </h3>
        <p style={{ fontSize: "14px", color: "#555", margin: "12px 0 24px" }}>
          ToTem 서비스를 시작해보세요
        </p>
        <button
          onClick={() => {
            onClose();
            router.push("/toolpage/schedule");
          }}
          style={buttonStyle}
        >
          ToTem 시작하기
        </button>
      </div>
    </>
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "32px",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            fontSize: "20px",
            color: "#999",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
        <h2
          style={{
            fontWeight: 700,
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            marginBottom: "10px",
            color: "#111",
          }}
        >
          <Image src="/TOTEM%20로고.png" alt="ToTem" width={20} height={20} />
          ToTem
        </h2>

        {message && (
          <div
            style={{
              backgroundColor: "#FEE2E2",
              color: "#EF4444",
              padding: "8px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              textAlign: "center",
              width: "100%",
            }}
          >
            {message}
          </div>
        )}

        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
