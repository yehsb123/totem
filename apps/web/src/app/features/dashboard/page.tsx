import type { Metadata } from "next";
import { FeatureHero, Screenshot } from "@/components/features/FeatureBlocks";

export const metadata: Metadata = {
  title: "대시보드",
  description: "방문자 수, 소비액, SNS 언급량까지 관광 트렌드를 한 화면에서 시각화로 확인하세요.",
  alternates: { canonical: "/features/dashboard" },
};

export default function DashboardFeaturePage() {
  return (
    <>
      <FeatureHero
        title={
          <>
            대시보드로
            <br />
            관광 트렌드를 한눈에 확인하세요
          </>
        }
        description="방문자 수, 소비액, SNS 언급량까지 한 화면에서 시각화로 제공합니다."
      />
      <Screenshot src="/dashboardexample.png" width={1694} height={889} alt="대시보드 예시 화면" priority />
    </>
  );
}
