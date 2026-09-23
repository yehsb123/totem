"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function TutorialPage() {
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

        <h1 className="text-4xl font-extrabold text-center mb-4">
          튜토리얼 영상
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          플랫폼의 주요 기능을 영상으로 쉽게 따라 해보세요.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-gray-100 rounded-xl overflow-hidden shadow-md">
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/영상_ID_1"
                title="튜토리얼 1"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-1">
                시작하기: 첫 번째 프로젝트 만들기
              </h3>
              <p className="text-sm text-gray-500">
                가장 기본적인 사용법을 빠르게 익히는 영상입니다.
              </p>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl overflow-hidden shadow-md">
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/영상_ID_2"
                title="튜토리얼 2"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-1">
                고급 기능 활용하기: 데이터 분석
              </h3>
              <p className="text-sm text-gray-500">
                플랫폼의 데이터 분석 기능을 심도 있게 다룹니다.
              </p>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl overflow-hidden shadow-md">
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/영상_ID_3"
                title="튜토리얼 3"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-1">팀원과 협업하기</h3>
              <p className="text-sm text-gray-500">
                팀원과 효과적으로 협업하는 방법을 알려드립니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
