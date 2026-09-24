import type { Metadata } from "next";
import { FeatureHero, FeatureSection, Screenshot } from "@/components/features/FeatureBlocks";

export const metadata: Metadata = {
  title: "투어관리",
  description: "코스별 일정과 진행 상태(진행중·예정·종료)를 한눈에 보고 효율적으로 관리하세요.",
  alternates: { canonical: "/features/tour" },
};

export default function TourFeaturePage() {
  return (
    <>
      <FeatureHero
        title={
          <>
            투어관리로
            <br />
            모든 일정을 손쉽게 운영하세요
          </>
        }
        description={
          <>
            코스별 일정과 상태를 한 눈에 보고 <br className="hidden sm:inline" />
            효율적으로 관리할 수 있습니다.
          </>
        }
      />
      <Screenshot src="/tourexample.png" width={1737} height={677} alt="투어관리 예시 화면" priority />

      <FeatureSection
        title="진행 상태별로 한눈에 확인"
        description={
          <>
            ‘진행중’, ‘예정’, ‘종료’ 상태를 한 번에 확인하고 <br className="hidden sm:inline" />
            원하는 항목만 빠르게 필터링할 수 있어요.
          </>
        }
      >
        {/* 이미지 미수령: images/tourmanage-toggle-example.png */}
        <Screenshot alt="상태별 필터 토글 예시" placeholder="images/tourmanage-toggle-example.png" size="md" />
      </FeatureSection>
    </>
  );
}
