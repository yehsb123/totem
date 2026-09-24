import type { Metadata } from "next";
import { FeatureCards, FeatureHero, Screenshot } from "@/components/features/FeatureBlocks";

export const metadata: Metadata = {
  title: "코스메이커",
  description: "관광지를 골라 날짜·시간대별로 배치해 여행사만의 시그니처 투어 코스를 쉽고 빠르게 완성하세요.",
  alternates: { canonical: "/features/coursemaker" },
};

export default function CourseMakerFeaturePage() {
  return (
    <>
      <FeatureHero
        title={
          <>
            코스메이커로
            <br />
            여행사만의 투어를 완성해보세요
          </>
        }
        description="여행사만의 시그니처 코스를 쉽고 빠르게 완성하세요."
      />
      <Screenshot src="/images/coursemaker-example.png" width={1600} height={900} alt="코스메이커 예시 화면 — 장소 목록과 일차별 시간대 일정" priority />
      <FeatureCards
        items={[
          { title: "관광지 추천", body: "관광공사 데이터 기반으로 지역·분류별 관광지를 골라 담을 수 있습니다." },
          { title: "지도에서 동선 확인", body: "선택한 장소를 지도에 표시해 이동 동선을 한눈에 검토합니다." },
          { title: "투어로 바로 등록", body: "완성한 코스는 투어·일정으로 이어져 운영까지 한 번에 연결됩니다." },
        ]}
      />
    </>
  );
}
