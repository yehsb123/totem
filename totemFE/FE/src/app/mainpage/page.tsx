"use client";

import Image from "next/image";
import { useState } from "react";
import SignupModal from "./signupmodal";

export default function MainPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <Image
        src="/토템사이트들어가면나오는페이지배경.png"
        alt="배경"
        fill
        style={{ objectFit: "cover" }}
        priority
        onError={(e) => {
          console.log("이미지 로드 실패, fallback 적용");
          e.currentTarget.style.display = "none";
        }}
      />
      {/* Fallback 배경 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: "#fff",
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(24px, 3vw, 48px)",
            fontWeight: 700,
            marginBottom: "1.5vw",
          }}
        >
          고객을 위한
          <br />
          투어 코스를 만들어보세요
        </h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "#000",
            color: "#fff",
            padding: "clamp(12px, 0.8vw, 16px) clamp(24px, 1.9vw, 36px)",

            fontSize: "clamp(16px, 1vw, 24px)",
            borderRadius: "9999px",
            border: "none",
            cursor: "pointer",
          }}
        >
          무료로 시작하기
        </button>
      </div>

      {showModal && (
        <SignupModal onClose={() => setShowModal(false)} initialStep={0} />
      )}
    </div>
  );
}
