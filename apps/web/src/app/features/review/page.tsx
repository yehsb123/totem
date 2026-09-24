import type { Metadata } from "next";
import { FeatureHero, FeatureSection, Screenshot } from "@/components/features/FeatureBlocks";

export const metadata: Metadata = {
  title: "리뷰관리",
  description: "여행 종료 후 받은 리뷰를 한눈에 모아 분석하고, 필요한 정보를 PDF 보고서로 내려받으세요.",
  alternates: { canonical: "/features/review" },
};

export default function ReviewFeaturePage() {
  return (
    <>
      <FeatureHero
        title={
          <>
            리뷰 관리로 고객 피드백을 <br /> 체계적으로 정리하세요
          </>
        }
        description={
          <>
            여행 종료 후 받은 리뷰를 한눈에 모아보고, <br className="hidden sm:inline" />
            서비스 품질을 꾸준히 개선할 수 있습니다.
          </>
        }
      />

      <FeatureSection
        title="필터링부터 PDF 리포트까지"
        description={
          <>
            날짜, 별점, 키워드 등 다양한 조건으로 리뷰를 분석하고, <br className="hidden sm:inline" />
            필요한 정보를 PDF 보고서로 손쉽게 다운로드하세요.
          </>
        }
      >
        {/* 이미지 미수령: images/review-combined-example.png */}
        <Screenshot alt="리뷰 관리 기능 예시" placeholder="images/review-combined-example.png" size="md" />
      </FeatureSection>
    </>
  );
}
