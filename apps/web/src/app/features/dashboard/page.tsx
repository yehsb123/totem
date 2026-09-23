"use client";

import Image from "next/image";

export default function DashboardIntroducePage() {
  return (
    <div
      style={{
        backgroundColor: "#5985e1",
        color: "#fff",
        minHeight: "100vh",
        padding: "5.2vw 2vw 4vw",
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(24px, 2.5vw, 48px)",
          fontWeight: "bold",
          marginBottom: "0.8vw",
        }}
      >
        대시보드로
        <br />
        관광 트렌드를 한눈에 확인하세요
      </h1>
      <p
        style={{
          fontSize: "clamp(14px, 1vw, 20px)",
          marginBottom: "2vw",
        }}
      >
        방문자 수, 소비액, SNS 언급량까지 한 화면에서 시각화로 제공합니다.
      </p>

      <div
        style={{
          maxWidth: "min(56.25vw, 1080px)",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "0.6vw",
          overflow: "hidden",
          boxShadow: "0 0.2vw 1vw rgba(0,0,0,0.1)",
          padding: "1vw",
          boxSizing: "border-box",
        }}
      >
        <Image
          src="/dashboardexample.png"
          alt="대시보드 예시"
          width={1080}
          height={620}
          style={{
            maxWidth: "100%",
            height: "auto",
            borderRadius: "0.4vw",
          }}
        />
      </div>
    </div>
  );
}
