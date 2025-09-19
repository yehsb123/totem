"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function StartGuidePage() {
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
          시작 가이드
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          TOTEM의 핵심 기능을 단계별로 익히고, 여행 코스 기획을 시작해 보세요.
        </p>

        <div className="space-y-10">
          <div className="bg-gray-50 rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-1/2 text-center md:text-left">
              <span className="text-4xl font-bold text-indigo-500">1</span>
              <h2 className="text-2xl font-bold mt-2">
                코스 메이커로 첫 코스 만들기 🗺️
              </h2>
              <p className="text-gray-600 mt-2">
                코스 메이커 페이지에서 투어 API가 추천하는 관광지를 활용해 첫
                번째 코스를 만들어 보세요. 카카오맵에서 목적지를 하나씩 추가하며
                최적의 동선을 설계할 수 있습니다.
              </p>
            </div>
            <div className="md:w-1/2">
              <Image
                src="/images/guide_course_maker.png"
                alt="코스 메이커 화면 이미지"
                width={500}
                height={300}
                className="rounded-lg shadow-md"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-1/2 text-center md:text-left md:order-2">
              <span className="text-4xl font-bold text-indigo-500">2</span>
              <h2 className="text-2xl font-bold mt-2">
                캘린더에서 일정 관리하기 🗓️
              </h2>
              <p className="text-gray-600 mt-2">
                생성한 코스가 캘린더에 자동으로 표시됩니다. 일정 기간을
                드래그하거나 클릭하여 수정할 수 있으며, 목적지 및 중요한 메모를
                추가하여 효율적으로 관리하세요.
              </p>
            </div>
            <div className="md:w-1/2 md:order-1">
              <Image
                src="/images/guide_calendar.png"
                alt="캘린더 화면 이미지"
                width={500}
                height={300}
                className="rounded-lg shadow-md"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-1/2 text-center md:text-left">
              <span className="text-4xl font-bold text-indigo-500">3</span>
              <h2 className="text-2xl font-bold mt-2">
                대시보드로 트렌드 파악하기 📊
              </h2>
              <p className="text-gray-600 mt-2">
                관광 데이터랩의 최신 데이터로 현재 관광 트렌드를 분석해 보세요.
                어떤 지역이 인기 있는지, 관광객 수는 어떻게 변화하는지 확인하여
                새로운 코스 기획에 활용할 수 있습니다.
              </p>
            </div>
            <div className="md:w-1/2">
              <Image
                src="/images/guide_dashboard.png"
                alt="대시보드 화면 이미지"
                width={500}
                height={300}
                className="rounded-lg shadow-md"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-1/2 text-center md:text-left md:order-2">
              <span className="text-4xl font-bold text-indigo-500">4</span>
              <h2 className="text-2xl font-bold mt-2">
                리뷰 관리 페이지 활용하기 📝
              </h2>
              <p className="text-gray-600 mt-2">
                고객에게 리뷰 요청 링크를 보내고, 받은 피드백을 한 곳에서
                관리하세요. 고객의 소리를 분석하여 서비스 만족도를 높일 수
                있습니다.
              </p>
            </div>
            <div className="md:w-1/2 md:order-1">
              <Image
                src="/images/guide_review_management.png"
                alt="리뷰 관리 화면 이미지"
                width={500}
                height={300}
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
