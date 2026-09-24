import type { Metadata } from "next";
import BackLink from "../BackLink";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: "ToTem 서비스 소개, 코스메이커 사용법, 요금제, 고객 지원, 데이터 업데이트 주기 등 자주 묻는 질문과 답변.",
  alternates: { canonical: "/resources/faq" },
};

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: 1,
    question: "ToTem은 어떤 서비스인가요?",
    answer:
      "ToTem은 B2B SaaS 솔루션으로, 여행사나 가이드가 관광 코스를 효율적으로 기획하고 관리할 수 있도록 돕는 플랫폼입니다. 캘린더 일정 관리, 관광지 추천, 데이터 기반 분석, 리뷰 관리 등의 기능을 제공합니다.",
  },
  {
    id: 2,
    question: "코스 메이커 사용법이 궁금해요.",
    answer:
      "코스메이커에서 기간을 정하고, 관광정보(한국관광공사) 목록이나 카카오 검색으로 찾은 장소를 일차별 시간대 칸에 끌어다 놓거나 [담기]로 담으세요. 저장할 때 '투어관리에 등록'을 켜 두면 투어가 만들어지고 일정관리 달력에도 자동으로 표시되며, 투어 일정표(PDF)도 바로 출력할 수 있습니다.",
  },
  {
    id: 3,
    question: "요금제는 어떻게 되나요?",
    answer:
      "ToTem은 사용자의 필요에 맞춰 다양한 요금제를 제공합니다. 자세한 요금 정보는 '요금제' 페이지에서 확인하실 수 있으며, 무료 체험을 통해 모든 기능을 먼저 사용해 볼 수 있습니다.",
  },
  {
    id: 4,
    question: "고객 지원은 어떻게 받을 수 있나요?",
    answer:
      "고객 지원 채널(1:1 문의 등)은 준비 중입니다. 서비스 이용 중 오류가 나면 화면에 표시되는 '오류 ID'를 함께 알려주시면 원인을 빠르게 확인할 수 있습니다.",
  },
  {
    id: 5,
    question: "데이터는 얼마나 자주 업데이트되나요?",
    answer:
      "대시보드는 한국관광데이터랩의 제주 관광 통계를 월 단위로 제공합니다. 현재 2024년 7월부터 2025년 6월까지의 데이터가 들어 있으며, 새 달의 데이터가 추가되면 월 선택기에 자동으로 나타납니다.",
  },
];

export default function FAQPage() {
  return (
    <div className="bg-white px-4 py-20 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <BackLink />

        <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">자주 묻는 질문</h1>
        <p className="mb-12 mt-4 text-center text-base text-slate-600 sm:text-lg">
          ToTem에 대해 자주 묻는 질문들을 모아두었습니다.
        </p>

        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {faqs.map((faq) => (
            <details key={faq.id} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition-colors hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{faq.question}</h2>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-5 shrink-0 text-indigo-500 transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-5 pb-5 leading-relaxed text-slate-700">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
