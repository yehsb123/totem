import type { Metadata } from "next";
import ResourceCard from "./ResourceCard";

export const metadata: Metadata = {
  title: "리소스 센터",
  description: "ToTem 시작 가이드, 튜토리얼 영상, 자주 묻는 질문, API 문서 등 서비스 활용에 필요한 자료를 한곳에서 찾아보세요.",
  alternates: { canonical: "/resources" },
};

interface Section {
  id: string;
  nav: string;
  title: string;
  cards: { title: string; description: string; buttonText: string; href?: string }[];
}

// href 가 없는 카드는 아직 페이지가 없는 항목 ("준비 중" 표시)
const SECTIONS: Section[] = [
  {
    id: "onboarding",
    nav: "사용 가이드",
    title: "온보딩 및 사용 가이드",
    cards: [
      {
        title: "시작 가이드",
        description: "플랫폼의 주요 기능을 단계별로 빠르게 익혀보세요.",
        buttonText: "자세히 보기",
        href: "/resources/guide",
      },
      {
        title: "튜토리얼 영상",
        description: "주요 기능의 사용법을 영상으로 쉽게 따라 해보세요.",
        buttonText: "영상 보러가기",
        href: "/resources/tutorial",
      },
      {
        title: "자주 묻는 질문(FAQ)",
        description: "가장 궁금해하는 질문과 답변을 모아두었습니다.",
        buttonText: "FAQ 보기",
        href: "/resources/faq",
      },
    ],
  },
  {
    id: "tech",
    nav: "기술 자료",
    title: "기술 및 운영 자료",
    cards: [
      {
        title: "API 문서",
        description: "개발자를 위한 API 연동 및 기술 문서를 확인하세요.",
        buttonText: "문서 보기",
        href: "/resources/api",
      },
      { title: "통합 가이드", description: "다른 소프트웨어와 ToTem을 연결하는 방법을 설명합니다.", buttonText: "가이드 보기" },
      { title: "시스템 상태", description: "플랫폼의 실시간 운영 상태 및 점검 정보를 확인하세요.", buttonText: "상태 확인" },
    ],
  },
  {
    id: "success",
    nav: "고객 성공",
    title: "고객 성공 및 웨비나",
    cards: [
      { title: "고객 성공 사례", description: "실제 고객들의 성공 스토리를 통해 영감을 얻으세요.", buttonText: "사례 보기" },
      {
        title: "웨비나 및 이벤트",
        description: "신규 기능 소개, 활용 팁 등을 담은 웨비나를 다시 볼 수 있어요.",
        buttonText: "다시 보기",
      },
      { title: "블로그/백서", description: "산업 동향과 심층적인 기술 인사이트를 읽어보세요.", buttonText: "읽어보기" },
    ],
  },
  {
    id: "support",
    nav: "지원 채널",
    title: "지원 및 문의 채널",
    cards: [
      { title: "고객 지원팀 문의", description: "1:1 문의나 채팅으로 궁금한 점을 해결하세요.", buttonText: "문의하기" },
      { title: "커뮤니티 포럼", description: "다른 사용자와 정보를 교환하고 질문을 주고받으세요.", buttonText: "포럼 가기" },
      { title: "릴리즈 노트", description: "가장 최근 업데이트된 기능과 개선 사항을 확인하세요.", buttonText: "릴리즈 보기" },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="bg-white px-4 py-20 text-slate-800 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">리소스 센터</h1>
        <p className="mt-4 text-base text-slate-600 sm:text-lg">
          ToTem을 더 효과적으로 활용하고, 최신 소식을 확인하며, 필요한 모든 정보를 한곳에서 찾아보세요.
        </p>
      </header>

      <nav aria-label="리소스 분류" className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-indigo-500 px-5 py-2.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            {s.nav}
          </a>
        ))}
      </nav>

      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mx-auto mt-16 max-w-5xl scroll-mt-24">
          <h2 id={`${s.id}-title`} className="mb-6 text-center text-2xl font-bold text-slate-900">
            {s.title}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {s.cards.map((card) => (
              <ResourceCard key={card.title} {...card} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
