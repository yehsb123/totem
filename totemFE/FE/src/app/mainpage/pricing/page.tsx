"use client";

import React from "react";

export default function PricingPage() {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        minHeight: "100vh",
        paddingTop: "5.208vw",
        paddingBottom: "4.167vw",
        textAlign: "center",
        color: "#222222",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(24px, 2.5vw, 48px)",
          fontWeight: 700,
          marginBottom: "0.833vw",
        }}
      >
        TOTEM 요금제 안내
      </h1>
      <p
        style={{
          fontSize: "clamp(16px, 1.042vw, 20px)",
          color: "#333",
          marginBottom: "2.5vw",
        }}
      >
        당신의 여행사를 위한 유연한 요금제를 선택하세요.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "2.083vw",
          flexWrap: "wrap",
          padding: "0 2.083vw",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.625vw",
            boxShadow: "0 0.208vw 0.625vw rgba(0,0,0,0.1)",
            padding: "1.667vw",
            width: "clamp(280px, 15.625vw, 300px)",
            textAlign: "left",
            color: "#222",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(18px, 1.25vw, 24px)",
              fontWeight: 700,
            }}
          >
            Basic
          </h2>
          <p
            style={{
              fontSize: "clamp(24px, 1.667vw, 32px)",
              fontWeight: 600,
              margin: "0.625vw 0",
            }}
          >
            ₩29,000 /월
          </p>
          <ul style={{ listStyle: "none", padding: 0, lineHeight: "1.8" }}>
            <li>✔ 일정/코스 설계 기능</li>
            <li>✔ 투어 일정 PDF 생성</li>
            <li>✔ 관광데이터랩 기반 대시보드</li>
            <li>✔ 투어/리뷰관리 기능</li>
          </ul>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.625vw",
            boxShadow: "0 0.208vw 0.625vw rgba(0,0,0,0.1)",
            padding: "1.667vw",
            width: "clamp(280px, 15.625vw, 300px)",
            textAlign: "left",
            border: "2px solid #6366F1",
            color: "#222",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-1.042vw",
              right: "-1.042vw",
              backgroundColor: "#6366F1",
              color: "#fff",
              padding: "0.521vw 1.042vw",
              borderRadius: "0.625vw 0 0.625vw 0",
              fontSize: "0.833vw",
              fontWeight: 600,
            }}
          >
            예정
          </div>
          <h2
            style={{
              fontSize: "clamp(18px, 1.25vw, 24px)",
              fontWeight: 700,
              color: "#6366F1",
            }}
          >
            Pro
          </h2>
          <p
            style={{
              fontSize: "clamp(24px, 1.667vw, 32px)",
              fontWeight: 600,
              margin: "0.625vw 0",
            }}
          >
            ₩59,000 /월
          </p>
          <ul style={{ listStyle: "none", padding: 0, lineHeight: "1.8" }}>
            <li>✔ 모든 Basic 기능 포함</li>
            <li>✔ 가이드 매칭 시스템</li>
            <li>✔ 카카오톡 리마인더 (알림기능)</li>
            <li>✔ 전체 관리 고급 (태그/기록/생성 무제한)</li>
          </ul>
        </div>
      </div>

      <p
        style={{
          marginTop: "3.125vw",
          fontSize: "clamp(12px, 0.833vw, 16px)",
          color: "#777",
        }}
      >
        * 모든 요금제는 부가세(VAT) 별도입니다.
      </p>
    </div>
  );
}
