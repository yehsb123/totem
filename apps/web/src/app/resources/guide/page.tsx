import type { Metadata } from "next";
import Image from "next/image";
import BackLink from "../BackLink";

export const metadata: Metadata = {
  title: "시작 가이드",
  description: "코스메이커로 첫 코스 만들기부터 캘린더 일정 관리, 대시보드, 리뷰 관리까지 TOTEM 핵심 기능을 단계별로 익혀보세요.",
  alternates: { canonical: "/resources/guide" },
};

// image: 콘솔 데모 데이터로 캡처한 실제 화면 (1500×900)
const STEPS = [
  {
    title: "코스 메이커로 첫 코스 만들기",
    body: "코스 메이커에서 관광지·식당·숙소를 검색하고 인기순으로 골라, 일차별 시간대 칸에 끌어다 놓으세요. 담긴 장소는 지도에 순서대로 표시되고, '투어관리에 등록'을 켜면 저장과 동시에 투어가 만들어집니다.",
    image: "/images/guide_course_maker.png",
  },
  {
    title: "캘린더에서 일정 관리하기",
    body: "투어로 등록한 코스는 일정관리 달력에 자동으로 표시됩니다. 일정을 클릭해 기간·담당자·시간별 장소·메모를 수정하고, 라벨(투어·미팅·휴무 등)로 색을 나눠 한눈에 관리하세요.",
    image: "/images/guide_calendar.png",
  },
  {
    title: "대시보드로 트렌드 파악하기",
    body: "한국관광데이터랩 기반의 제주 관광 통계로 월별 방문객·관광 소비·SNS 언급량·국가별 방문 비중을 확인하세요. 전월 대비 변화와 인기 동반·여행 유형을 코스 기획에 활용할 수 있습니다.",
    image: "/images/guide_dashboard.png",
  },
  {
    title: "리뷰 관리 페이지 활용하기",
    body: "구글 폼으로 받은 설문 응답 시트(CSV)를 불러오거나 직접 입력해 투어별 리뷰를 모으세요. 총점과 식당·숙소·관광지·가이드 항목별 평균이 자동으로 계산됩니다.",
    image: "/images/guide_review_management.png",
  },
] as const;

export default function StartGuidePage() {
  return (
    <div className="bg-white px-4 py-20 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <BackLink />

        <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">시작 가이드</h1>
        <p className="mb-12 mt-4 text-center text-base text-slate-600 sm:text-lg">
          TOTEM의 핵심 기능을 단계별로 익히고, 여행 코스 기획을 시작해 보세요.
        </p>

        <ol className="space-y-8">
          {STEPS.map((step, idx) => {
            const reversed = idx % 2 === 1;
            return (
              <li key={step.title} className="flex flex-col items-center gap-6 rounded-xl bg-slate-50 p-6 md:flex-row">
                <div className={`text-center md:w-1/2 md:text-left ${reversed ? "md:order-2" : ""}`}>
                  <span className="text-4xl font-bold text-indigo-500">{idx + 1}</span>
                  <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{step.title}</h2>
                  <p className="mt-2 leading-relaxed text-slate-600">{step.body}</p>
                </div>
                <div className={`w-full md:w-1/2 ${reversed ? "md:order-1" : ""}`}>
                  <Image src={step.image} alt={`${step.title} 화면`} width={1500} height={900} sizes="(min-width: 768px) 50vw, 100vw" className="h-auto w-full rounded-lg border border-slate-200 shadow-sm" />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
