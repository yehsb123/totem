"use client";

import Image from "next/image";
import { useState } from "react";
import SignupModal from "./mainpage/signupmodal";

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <Image
        src="/토템사이트들어가면나오는페이지배경.png"
        alt="배경"
        fill
        style={{ objectFit: "cover" }}
        priority
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: "#000",
          zIndex: 5,
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
