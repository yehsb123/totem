"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: 1,
    question: "TOTEM은 어떤 서비스인가요?",
    answer:
      "TOTEM은 B2B SaaS 솔루션으로, 여행사나 가이드가 관광 코스를 효율적으로 기획하고 관리할 수 있도록 돕는 플랫폼입니다. 캘린더 일정 관리, 관광지 추천, 데이터 기반 분석, 리뷰 관리 등의 기능을 제공합니다.",
  },
  {
    id: 2,
    question: "코스 메이커 사용법이 궁금해요.",
    answer:
      "코스 메이커 페이지에서 투어 API가 추천하는 관광지를 선택하고, 카카오맵을 통해 코스를 설정할 수 있습니다. 여행 기간을 설정하고 메모를 추가하면 코스가 자동으로 캘린더에 등록됩니다.",
  },
  {
    id: 3,
    question: "요금제는 어떻게 되나요?",
    answer:
      "TOTEM은 사용자의 필요에 맞춰 다양한 요금제를 제공합니다. 자세한 요금 정보는 '요금제' 페이지에서 확인하실 수 있으며, 무료 체험을 통해 모든 기능을 먼저 사용해 볼 수 있습니다.",
  },
  {
    id: 4,
    question: "고객 지원은 어떻게 받을 수 있나요?",
    answer:
      "기술적인 문제나 기타 문의사항이 있으시면 '고객 지원' 페이지를 통해 문의해 주세요. 1:1 채팅, 이메일, 전화 등 다양한 채널을 통해 신속하게 답변해 드립니다.",
  },
  {
    id: 5,
    question: "데이터는 얼마나 자주 업데이트되나요?",
    answer:
      "대시보드에서 제공되는 관광 데이터는 관광 데이터랩의 최신 정보를 바탕으로 정기적으로 업데이트됩니다. 시장 트렌드에 대한 최신 정보를 항상 제공하기 위해 노력하고 있습니다.",
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleAnswer = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

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
          자주 묻는 질문
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          TOTEM에 대해 자주 묻는 질문들을 모아두었습니다.
        </p>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="border-b border-gray-200 cursor-pointer"
            >
              <div
                className="flex justify-between items-center p-4 bg-gray-50 rounded-t-lg transition-colors hover:bg-gray-100"
                onClick={() => toggleAnswer(faq.id)}
              >
                <h3 className="text-lg font-semibold text-gray-800">
                  {faq.question}
                </h3>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 text-indigo-500 transform transition-transform duration-200 ${
                    openId === faq.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {openId === faq.id && (
                <div className="p-4 bg-white rounded-b-lg text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
