"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SignupModal from "@/app/mainpage/signupmodal";
import axios from "axios";
import Script from "next/script";

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Auth: {
        authorize: (options: {
          redirectUri: string;
        }) => Promise<{ code: string }>;
      };
    };
  }
}

interface KakaoLoginResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope: string;
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(0);
  const router = useRouter();

  const menuItems = [
    { label: "코스메이커", path: "/mainpage/introduceservice/coursemaker" },
    { label: "대시보드", path: "/mainpage/introduceservice/dashboard" },
    { label: "투어관리", path: "/mainpage/introduceservice/tour" },
    { label: "일정관리", path: "/mainpage/introduceservice/schedule" },
    { label: "리뷰관리", path: "/mainpage/introduceservice/review" },
  ];

  const handleKakaoLogin = async () => {
    try {
      const authResponse = await window.Kakao.Auth.authorize({
        redirectUri: "http://localhost:8080/api/users/login/kakao",
      });

      const userResponse = await axios.get<KakaoLoginResponse>(
        `http://localhost:8000/api/users/login/kakao?code=${authResponse.code}`
      );

      if (userResponse.status === 200) {
        console.log("카카오 로그인 성공:", userResponse.data);
        localStorage.setItem("userAccessToken", userResponse.data.access_token);
        localStorage.setItem(
          "userRefreshToken",
          userResponse.data.refresh_token
        );
        router.push("/dashboard");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data.message ||
          "카카오 로그인 중 오류가 발생했습니다.";
        console.error("카카오 로그인 실패:", serverMessage);
      } else {
        console.error("카카오 로그인 실패:", error);
        alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    }
  };

  return (
    <>
      <Script
        src="https://developers.kakao.com/sdk/js/kakao.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init("YOUR_KAKAO_JAVASCRIPT_KEY");
            console.log("카카오 SDK가 초기화되었습니다.");
          }
        }}
      />

      <div style={{ margin: 0, padding: 0 }}>
        <div
          style={{
            height: "2.6vw",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20vw",
            position: "fixed",
            top: 0,
            width: "100%",
            zIndex: 100,
          }}
        >
          <div
            onClick={() => router.push("/mainpage")}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              gap: "0.5vw",
            }}
          >
            <Image
              src="/TOTEM%20로고.png"
              alt="ToTem 로고"
              width={48}
              height={48}
              style={{ width: "2.5vw", height: "2.5vw" }}
            />
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "1.5vw",
                color: "#000",
                letterSpacing: "-0.05vw",
              }}
            >
              ToTem
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: "1vw",
              fontSize: "0.8vw",
              color: "#000",
              position: "relative",
              marginRight: "25vw",
            }}
          >
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "inherit",
                  font: "inherit",
                }}
              >
                서비스 소개 {isOpen ? "▲" : "▼"}
              </button>

              {isOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    backgroundColor: "#fff",
                    boxShadow: "0 0.2vw 0.4vw rgba(0,0,0,0.1)",
                    borderRadius: "0.2vw",
                    padding: "0.4vw 0",
                    zIndex: 100,
                    minWidth: "8vw",
                  }}
                >
                  {menuItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "0.4vw 0.8vw",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setIsOpen(false);
                        router.push(item.path);
                      }}
                      onMouseOver={(e) =>
                        ((e.target as HTMLElement).style.backgroundColor =
                          "#f3f4f6")
                      }
                      onMouseOut={(e) =>
                        ((e.target as HTMLElement).style.backgroundColor =
                          "transparent")
                      }
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => router.push("/mainpage/pricing")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                font: "inherit",
              }}
            >
              가격안내 ▼
            </button>
            <button
              onClick={() => router.push("/mainpage/resources")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                font: "inherit",
              }}
            >
              리소스 ▼
            </button>
          </div>
          <div style={{ display: "flex", gap: "0.625vw" }}>
            <button
              onClick={() => {
                setModalStep(1);
                setShowModal(true);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8vw",
                color: "#000",
              }}
            >
              로그인
            </button>

            <button
              onClick={() => {
                setModalStep(0);
                setShowModal(true);
              }}
              style={{
                backgroundColor: "#6366F1",
                color: "#fff",
                border: "none",
                borderRadius: "0.3vw",
                padding: "0.3vw 0.6vw",
                fontSize: "0.7vw",
                cursor: "pointer",
              }}
            >
              무료로 시작하기
            </button>
          </div>
        </div>
        <main style={{ paddingTop: "2.6vw" }}>{children}</main>
        <button
          onClick={handleKakaoLogin}
          style={{
            position: "fixed",
            bottom: "2vw",
            right: "2vw",
            zIndex: 1000,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            borderRadius: "0.5vw",
            overflow: "hidden",
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          <Image
            src="/카카오로그인버튼.png"
            alt="카카오 회원가입/로그인"
            width={200}
            height={48}
            style={{ width: "10vw", height: "2.5vw" }}
          />
        </button>
        {showModal && (
          <SignupModal
            onClose={() => setShowModal(false)}
            initialStep={modalStep}
          />
        )}
      </div>
    </>
  );
}
