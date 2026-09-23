"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function APIDocsPage() {
  const router = useRouter();

  return (
    <div className="bg-white min-h-screen px-5 py-20 text-gray-800 font-sans md:px-10 lg:px-20">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          뒤로가기
        </button>

        <h1 className="text-4xl font-extrabold text-center mb-4">API 문서</h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          TOTEM API를 사용하여 외부 서비스와 연동하고, 코스를 관리하세요.
        </p>

        {/* 1. 인증 섹션 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. 인증 (Authentication)</h2>
          <div className="bg-gray-100 p-6 rounded-lg">
            <p className="text-gray-700 mb-4">
              모든 API 요청은 API 키를 포함해야 합니다. API 키는 프로필 설정
              페이지에서 발급받을 수 있습니다.
            </p>
            <div className="bg-gray-200 p-4 rounded-md">
              <span className="font-mono text-sm">
                Header:{" "}
                <span className="text-indigo-600">
                  X-API-KEY: your_api_key_here
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. 코스 목록 조회 섹션 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">2. 코스 목록 조회</h2>
          <div className="bg-gray-100 p-6 rounded-lg">
            <p className="text-gray-700 mb-4">
              사용자가 생성한 모든 코스 목록을 가져옵니다.
            </p>
            <div className="mb-4">
              <span className="font-bold text-sm bg-green-500 text-white px-2 py-1 rounded-full">
                GET
              </span>
              <span className="font-mono ml-2 text-sm">/api/v1/courses</span>
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-2">응답 (Response)</h3>
            <div className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto">
              <pre>
                {`{
  "status": "success",
  "data": [
    {
      "id": "course-01",
      "title": "서울 도심 투어",
      "startDate": "2025-09-01",
      "endDate": "2025-09-03"
    },
    {
      "id": "course-02",
      "title": "제주도 힐링 코스",
      "startDate": "2025-10-15",
      "endDate": "2025-10-18"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. 새로운 코스 생성</h2>
          <div className="bg-gray-100 p-6 rounded-lg">
            <p className="text-gray-700 mb-4">새로운 여행 코스를 생성합니다.</p>
            <div className="mb-4">
              <span className="font-bold text-sm bg-blue-500 text-white px-2 py-1 rounded-full">
                POST
              </span>
              <span className="font-mono ml-2 text-sm">/api/v1/courses</span>
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-2">
              요청 본문 (Request Body)
            </h3>
            <div className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto">
              <pre>
                {`{
  "title": "부산 해안 투어",
  "startDate": "2025-11-20",
  "endDate": "2025-11-22",
  "destinations": [
    { "name": "해운대", "lat": 35.163, "lng": 129.161 },
    { "name": "광안리", "lat": 35.153, "lng": 129.119 }
  ]
}`}
              </pre>
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-2">응답 (Response)</h3>
            <div className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto">
              <pre>
                {`{
  "status": "success",
  "message": "코스가 성공적으로 생성되었습니다.",
  "courseId": "course-03"
}`}
              </pre>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">4. 기타 API 및 지원</h2>
          <p className="text-gray-700">
            이 페이지의 내용은 B2B SaaS 플랫폼 TOTEM 의 가상의 예시를 기반으로
            작성되었습니다. 실제 서비스의 API 엔드포인트, 요청 및 응답 형식은
            다를 수 있으며, 개발 가이드는 실제 문서를 참고해 주시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
}
