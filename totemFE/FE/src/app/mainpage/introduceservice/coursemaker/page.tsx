"use client";

import Image from "next/image";

export default function CourseMakerIntroducePage() {
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
        코스메이커로
        <br />
        여행사만의 투어를 완성해보세요
      </h1>
      <p
        style={{
          fontSize: "clamp(14px, 1.042vw, 20px)",
          marginBottom: "2.083vw",
        }}
      >
        여행사만의 시그니처 코스를 쉽고 빠르게 완성하세요.
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
          src="/example_coursemaker.png"
          alt="코스메이커 예시"
          width={1080}
          height={620}
          style={{
            maxWidth: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
