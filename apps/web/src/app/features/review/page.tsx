"use client";

import Image from "next/image";

export default function ReviewIntroducePage() {
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
        리뷰 관리로 고객 피드백을 <br /> 체계적으로 정리하세요
      </h1>
      <p
        style={{
          fontSize: "clamp(16px, 1.042vw, 20px)",
          marginBottom: "2.083vw",
        }}
      >
        여행 종료 후 받은 리뷰를 한눈에 모아보고, <br />
        서비스 품질을 꾸준히 개선할 수 있습니다.
      </p>

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
          필터링부터 PDF 리포트까지
        </h2>
        <p
          style={{
            fontSize: "clamp(14px, 0.938vw, 18px)",
            marginBottom: "2.083vw",
          }}
        >
          날짜, 별점, 키워드 등 다양한 조건으로 리뷰를 분석하고, <br />
          필요한 정보를 PDF 보고서로 손쉽게 다운로드하세요.
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
            src="/images/review-combined-example.png"
            alt="리뷰 관리 기능 예시"
            width={900}
            height={500}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
      </div>
    </div>
  );
}
