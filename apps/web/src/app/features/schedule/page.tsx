"use client";

import Image from "next/image";

export default function ScheduleIntroducePage() {
  return (
    <div
      style={{
        backgroundColor: "#5985e1",
        color: "#fff",
        minHeight: "100vh",
        paddingTop: "5.208vw",
        paddingBottom: "4.167vw",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(24px, 2.5vw, 48px)",
          fontWeight: "bold",
          marginBottom: "0.833vw",
          lineHeight: "1.2",
        }}
      >
        일정 관리로 <br /> 투어 일정을 한눈에 확인하세요
      </h1>
      <p
        style={{
          fontSize: "clamp(16px, 1.042vw, 20px)",
          marginBottom: "2.083vw",
        }}
      >
        캘린더 기반으로 투어 일정을 손쉽게 관리하고 <br />
        날짜별 코스를 직관적으로 확인할 수 있습니다.
      </p>

      <div
        style={{
          maxWidth: "min(56.25vw, 1080px)",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "0.625vw",
          boxShadow: "0 0.208vw 1.042vw rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <Image
          src="/images/schedule-intro.png"
          alt="일정 관리 페이지 예시"
          width={1080}
          height={620}
          style={{ maxWidth: "100%", height: "auto" }}
          priority
        />
      </div>

      <div
        style={{
          marginTop: "4.167vw",
          padding: "0 1.25vw",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(20px, 1.667vw, 32px)",
            fontWeight: "bold",
            marginBottom: "0.833vw",
          }}
        >
          캘린더 기반 일정 관리
        </h2>
        <p
          style={{
            fontSize: "clamp(14px, 0.938vw, 18px)",
            marginBottom: "2.083vw",
          }}
        >
          모든 투어 일정을 달력에 표시하고, <br />
          특정 날짜를 선택해 코스를 바로 확인하세요.
        </p>

        <div
          style={{
            maxWidth: "min(46.875vw, 900px)",
            margin: "0 auto",
            backgroundColor: "white",
            borderRadius: "0.625vw",
            boxShadow: "0 0.208vw 0.833vw rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <Image
            src="/images/schedule-calendar-example.png"
            alt="캘린더 일정 관리 예시 화면"
            width={900}
            height={500}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "4.167vw",
          padding: "0 1.25vw",
          maxWidth: "min(52.083vw, 1000px)",
          margin: "4.167vw auto 0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.667vw",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            color: "#333",
            borderRadius: "1vw",
            padding: "2vw",
            boxShadow:
              "0 1vw 2vw rgba(0,0,0,0.1), 0 0.5vw 1vw rgba(0,0,0,0.05)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h3
            style={{
              fontSize: "clamp(16px, 1.042vw, 20px)",
              fontWeight: "bold",
              marginBottom: "0.417vw",
            }}
          >
            한눈에 보는 월간 뷰
          </h3>
          <p
            style={{
              fontSize: "clamp(12px, 0.729vw, 14px)",
              color: "#555",
            }}
          >
            투어 시작일부터 종료일까지 자동 표시되어 겹치는 일정을 쉽게 확인할
            수 있습니다.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            color: "#333",
            borderRadius: "1vw",
            padding: "2vw",
            boxShadow:
              "0 1vw 2vw rgba(0,0,0,0.1), 0 0.5vw 1vw rgba(0,0,0,0.05)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h3
            style={{
              fontSize: "clamp(16px, 1.042vw, 20px)",
              fontWeight: "bold",
              marginBottom: "0.417vw",
            }}
          >
            날짜별 상세 코스
          </h3>
          <p
            style={{
              fontSize: "clamp(12px, 0.729vw, 14px)",
              color: "#555",
            }}
          >
            특정 날짜를 선택하면 코스 시간표, 담당자, 장소 정보를 즉시 확인하고
            수정할 수 있습니다.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            color: "#333",
            borderRadius: "1vw",
            padding: "2vw",
            boxShadow:
              "0 1vw 2vw rgba(0,0,0,0.1), 0 0.5vw 1vw rgba(0,0,0,0.05)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h3
            style={{
              fontSize: "clamp(16px, 1.042vw, 20px)",
              fontWeight: "bold",
              marginBottom: "0.417vw",
            }}
          >
            라벨 & 색상 구분
          </h3>
          <p
            style={{
              fontSize: "clamp(12px, 0.729vw, 14px)",
              color: "#555",
            }}
          >
            투어 유형별 색상 라벨과 이모티콘을 적용해 누구나 직관적으로 이해할
            수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
