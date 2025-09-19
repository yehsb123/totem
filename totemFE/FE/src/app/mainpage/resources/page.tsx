"use client";

import React, { useRef, useCallback, useMemo } from "react";
import ResourceCard from "./ResourceCard";

export default function ResourcePage() {
  const onboardingRef = useRef<HTMLDivElement | null>(null);
  const techRef = useRef<HTMLDivElement | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);
  const supportRef = useRef<HTMLDivElement | null>(null);

  const sectionsRef = useMemo(
    (): Record<
      "onboarding" | "tech" | "success" | "support",
      React.RefObject<HTMLDivElement | null>
    > => ({
      onboarding: onboardingRef,
      tech: techRef,
      success: successRef,
      support: supportRef,
    }),
    [onboardingRef, techRef, successRef, supportRef]
  );

  const scrollToSection = useCallback(
    (sectionName: keyof typeof sectionsRef) => {
      sectionsRef[sectionName].current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [sectionsRef]
  );

  return (
    <div className="bg-white min-h-screen px-5 py-20 text-gray-800 font-sans md:px-10 lg:px-20">
      <h1 className="text-4xl font-extrabold text-center mb-4">리소스 센터</h1>
      <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
        TOTEM을 더 효과적으로 활용하고, 최신 소식을 확인하며, 필요한 모든 정보를
        한곳에서 찾아보세요.
      </p>

      <div className="flex flex-wrap justify-center gap-4 mb-16 max-w-4xl mx-auto">
        <button
          onClick={() => scrollToSection("onboarding")}
          className="px-6 py-3 border border-indigo-500 text-indigo-500 rounded-full font-medium hover:bg-indigo-50 transition-colors"
        >
          사용 가이드 🧑‍🎓
        </button>
        <button
          onClick={() => scrollToSection("tech")}
          className="px-6 py-3 border border-indigo-500 text-indigo-500 rounded-full font-medium hover:bg-indigo-50 transition-colors"
        >
          기술 자료 🛠️
        </button>
        <button
          onClick={() => scrollToSection("success")}
          className="px-6 py-3 border border-indigo-500 text-indigo-500 rounded-full font-medium hover:bg-indigo-50 transition-colors"
        >
          고객 성공 🏆
        </button>
        <button
          onClick={() => scrollToSection("support")}
          className="px-6 py-3 border border-indigo-500 text-indigo-500 rounded-full font-medium hover:bg-indigo-50 transition-colors"
        >
          지원 채널 🆘
        </button>
      </div>

      <section ref={sectionsRef.onboarding} className="mb-12 pt-20 -mt-20">
        <h2 className="text-2xl font-bold mb-6 text-center">
          온보딩 및 사용 가이드 🧑‍🎓
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <ResourceCard
            title="시작 가이드"
            description="플랫폼의 주요 기능을 단계별로 빠르게 익혀보세요."
            buttonText="자세히 보기"
            href="/mainpage/resources/guide"
          />
          <ResourceCard
            title="튜토리얼 영상"
            description="주요 기능의 사용법을 영상으로 쉽게 따라 해보세요."
            buttonText="영상 보러가기"
            href="/mainpage/resources/tutorial"
          />
          <ResourceCard
            title="자주 묻는 질문(FAQ)"
            description="가장 궁금해하는 질문과 답변을 모아두었습니다."
            buttonText="FAQ 보기"
            href="/mainpage/resources/faq"
          />
        </div>
      </section>

      <section ref={sectionsRef.tech} className="mb-12 pt-20 -mt-20">
        <h2 className="text-2xl font-bold mb-6 text-center">
          기술 및 운영 자료 🛠️
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <ResourceCard
            title="API 문서"
            description="개발자를 위한 API 연동 및 기술 문서를 확인하세요."
            buttonText="문서 보기"
            href="/mainpage/resources/api"
          />
          <ResourceCard
            title="통합 가이드"
            description="다른 소프트웨어와 TOTEM을 연결하는 방법을 설명합니다."
            buttonText="가이드 보기"
            href="/mainpage/resources/integration"
          />
          <ResourceCard
            title="시스템 상태"
            description="플랫폼의 실시간 운영 상태 및 점검 정보를 확인하세요."
            buttonText="상태 확인"
            href="/mainpage/resources/status"
          />
        </div>
      </section>

      <section ref={sectionsRef.success} className="mb-12 pt-20 -mt-20">
        <h2 className="text-2xl font-bold mb-6 text-center">
          고객 성공 및 웨비나 🏆
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <ResourceCard
            title="고객 성공 사례"
            description="실제 고객들의 성공 스토리를 통해 영감을 얻으세요."
            buttonText="사례 보기"
            href="/mainpage/resources/success-stories"
          />
          <ResourceCard
            title="웨비나 및 이벤트"
            description="신규 기능 소개, 활용 팁 등을 담은 웨비나를 다시 볼 수 있어요."
            buttonText="다시 보기"
            href="/mainpage/resources/webinars"
          />
          <ResourceCard
            title="블로그/백서"
            description="산업 동향과 심층적인 기술 인사이트를 읽어보세요."
            buttonText="읽어보기"
            href="/mainpage/resources/blog"
          />
        </div>
      </section>

      <section ref={sectionsRef.support} className="pt-20 -mt-20">
        <h2 className="text-2xl font-bold mb-6 text-center">
          지원 및 문의 채널 🆘
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <ResourceCard
            title="고객 지원팀 문의"
            description="1:1 문의나 채팅으로 궁금한 점을 해결하세요."
            buttonText="문의하기"
            href="/mainpage/resources/support"
          />
          <ResourceCard
            title="커뮤니티 포럼"
            description="다른 사용자와 정보를 교환하고 질문을 주고받으세요."
            buttonText="포럼 가기"
            href="/mainpage/resources/community"
          />
          <ResourceCard
            title="릴리즈 노트"
            description="가장 최근 업데이트된 기능과 개선 사항을 확인하세요."
            buttonText="릴리즈 보기"
            href="/mainpage/resources/release-notes"
          />
        </div>
      </section>
    </div>
  );
}
