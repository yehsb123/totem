import type { Metadata } from "next";
import ScreenshotPlaceholder from "@/components/ScreenshotPlaceholder";
import BackLink from "../BackLink";

export const metadata: Metadata = {
  title: "시작 가이드",
  description: "코스메이커로 첫 코스 만들기부터 캘린더 일정 관리, 대시보드, 리뷰 관리까지 TOTEM 핵심 기능을 단계별로 익혀보세요.",
  alternates: { canonical: "/resources/guide" },
};

// image: 받을 예정인 스크린샷 파일명 (현재 모두 미수령 → 자리표시)
const STEPS = [
  {
    title: "코스 메이커로 첫 코스 만들기",
    body: "코스 메이커 페이지에서 투어 API가 추천하는 관광지를 활용해 첫 번째 코스를 만들어 보세요. 카카오맵에서 목적지를 하나씩 추가하며 최적의 동선을 설계할 수 있습니다.",
    image: "images/guide_course_maker.png",
  },
  {
    title: "캘린더에서 일정 관리하기",
    body: "생성한 코스가 캘린더에 자동으로 표시됩니다. 일정 기간을 드래그하거나 클릭하여 수정할 수 있으며, 목적지 및 중요한 메모를 추가하여 효율적으로 관리하세요.",
    image: "images/guide_calendar.png",
  },
  {
    title: "대시보드로 트렌드 파악하기",
    body: "관광 데이터랩의 최신 데이터로 현재 관광 트렌드를 분석해 보세요. 어떤 지역이 인기 있는지, 관광객 수는 어떻게 변화하는지 확인하여 새로운 코스 기획에 활용할 수 있습니다.",
    image: "images/guide_dashboard.png",
  },
  {
    title: "리뷰 관리 페이지 활용하기",
    body: "고객에게 리뷰 요청 링크를 보내고, 받은 피드백을 한 곳에서 관리하세요. 고객의 소리를 분석하여 서비스 만족도를 높일 수 있습니다.",
    image: "images/guide_review_management.png",
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
                  <ScreenshotPlaceholder name={step.image} aspect="5 / 3" />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
