"use client";

import Image from "next/image";

export default function TourManageIntroducePage() {
  return (
    <div
      style={{
        backgroundColor: "#5985e1",
        color: "#fff",
        minHeight: "100vh",
        paddingTop: "5.208vw",
        textAlign: "center",
        paddingBottom: "4.167vw",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(24px, 2.5vw, 48px)",
          fontWeight: "bold",
          marginBottom: "0.833vw",
        }}
      >
        투어관리로
        <br />
        모든 일정을 손쉽게 운영하세요
      </h1>
      <p
        style={{
          fontSize: "clamp(16px, 1.042vw, 20px)",
          marginBottom: "2.083vw",
        }}
      >
        코스별 일정과 상태를 한 눈에 보고 <br />
        효율적으로 관리할 수 있습니다.
      </p>

      <div
        style={{
          maxWidth: "min(56.25vw, 1080px)",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "0.625vw",
          overflow: "hidden",
          boxShadow: "0 0.208vw 1.042vw rgba(0,0,0,0.1)",
        }}
      >
        <Image
          src="/tourexample.png"
          alt="투어관리 예시"
          width={1080}
          height={620}
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </div>

      <div
        style={{
          marginTop: "4.167vw",
          padding: "0 1.25vw",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(20px, 1.667vw, 32px)",
            fontWeight: "bold",
            marginBottom: "0.833vw",
          }}
        >
          진행 상태별로 한눈에 확인
        </h2>
        <p
          style={{
            fontSize: "clamp(14px, 0.938vw, 18px)",
            marginBottom: "2.083vw",
          }}
        >
          ‘진행중’, ‘예정’, ‘종료’ 상태를 한 번에 확인하고 <br />
          원하는 항목만 빠르게 필터링할 수 있어요.
        </p>

        <div
          style={{
            maxWidth: "min(46.875vw, 900px)",
            margin: "0 auto",
            backgroundColor: "white",
            borderRadius: "0.625vw",
            overflow: "hidden",
            boxShadow: "0 0.208vw 0.833vw rgba(0,0,0,0.1)",
          }}
        >
          <Image
            src="/images/tourmanage-toggle-example.png"
            alt="상태별 필터 토글 예시"
            width={900}
            height={500}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
      </div>
    </div>
  );
}
