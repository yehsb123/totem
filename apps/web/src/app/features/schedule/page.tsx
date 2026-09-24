import type { Metadata } from "next";
import { FeatureCards, FeatureHero, FeatureSection, Screenshot } from "@/components/features/FeatureBlocks";

export const metadata: Metadata = {
  title: "일정관리",
  description: "캘린더 기반으로 투어 일정을 손쉽게 관리하고 날짜별 코스를 직관적으로 확인하세요.",
  alternates: { canonical: "/features/schedule" },
};

export default function ScheduleFeaturePage() {
  return (
    <>
      <FeatureHero
        title={
          <>
            일정 관리로 <br /> 투어 일정을 한눈에 확인하세요
          </>
        }
        description={
          <>
            캘린더 기반으로 투어 일정을 손쉽게 관리하고 <br className="hidden sm:inline" />
            날짜별 코스를 직관적으로 확인할 수 있습니다.
          </>
        }
      />
      <Screenshot src="/images/schedule-intro.png" width={1600} height={900} alt="일정 관리 페이지 예시 — 라벨별 색상 달력" priority />

      <FeatureSection
        title="캘린더 기반 일정 관리"
        description={
          <>
            모든 투어 일정을 달력에 표시하고, <br className="hidden sm:inline" />
            특정 날짜를 선택해 코스를 바로 확인하세요.
          </>
        }
      >
        <Screenshot src="/images/schedule-calendar-example.png" width={1180} height={609} alt="캘린더 일정 상세 예시 — 기간·담당자·시간별 장소" size="md" />
      </FeatureSection>

      <FeatureCards
        items={[
          {
            title: "한눈에 보는 월간 뷰",
            body: "투어 시작일부터 종료일까지 자동 표시되어 겹치는 일정을 쉽게 확인할 수 있습니다.",
          },
          {
            title: "날짜별 상세 코스",
            body: "특정 날짜를 선택하면 코스 시간표, 담당자, 장소 정보를 즉시 확인하고 수정할 수 있습니다.",
          },
          {
            title: "라벨 & 색상 구분",
            body: "투어 유형별 색상 라벨과 이모티콘을 적용해 누구나 직관적으로 이해할 수 있습니다.",
          },
        ]}
      />
    </>
  );
}
