import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import LoginQueryOpener from "@/components/auth/LoginQueryOpener";
import StartButton from "@/components/auth/StartButton";

export const metadata: Metadata = {
  // 홈은 템플릿(%s | Totem) 대신 기본 제목을 그대로 쓴다
  title: { absolute: "ToTem — 여행사를 위한 투어·코스 운영 도구" },
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    title: "코스메이커",
    href: "/features/coursemaker",
    body: "관광지를 골라 시간대별로 배치하면 여행사만의 코스가 완성됩니다.",
  },
  {
    title: "대시보드",
    href: "/features/dashboard",
    body: "방문자 수·소비액·SNS 언급량으로 관광 트렌드를 한눈에 확인합니다.",
  },
  {
    title: "투어관리",
    href: "/features/tour",
    body: "진행중·예정·종료 상태별로 모든 투어를 정리하고 필터링합니다.",
  },
  {
    title: "일정관리",
    href: "/features/schedule",
    body: "캘린더에서 투어 일정과 날짜별 코스를 바로 확인하고 수정합니다.",
  },
  {
    title: "리뷰관리",
    href: "/features/review",
    body: "투어 후기를 모아 분석하고 PDF 리포트로 내려받습니다.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* 콘솔에서 /?login=1&next=... 로 넘어오면 로그인 모달을 연다 */}
      <Suspense fallback={null}>
        <LoginQueryOpener />
      </Suspense>

      <section className="relative isolate flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-sky-100">
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
        {/* 문구 가독성을 위한 옅은 흰색 막 */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-white/45" />

        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <p className="mb-4 text-sm font-semibold text-indigo-700 sm:text-base">여행사를 위한 투어·코스 운영 도구</p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl sm:leading-tight">
            고객을 위한
            <br />
            투어 코스를 만들어보세요
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-700 sm:text-lg">
            코스 설계부터 일정·투어·리뷰 관리까지, 설치 없이 브라우저에서 바로 시작하세요.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <StartButton className="w-full rounded-full bg-slate-950 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800 sm:w-auto" />
            <Link
              href="/features/coursemaker"
              className="w-full rounded-full border border-slate-300 bg-white/80 px-8 py-3.5 text-base font-semibold text-slate-800 transition hover:bg-white sm:w-auto"
            >
              서비스 둘러보기
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            투어 운영에 필요한 기능을 한곳에
          </h2>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.href}>
                <Link
                  href={f.href}
                  className="flex h-full flex-col rounded-xl border border-slate-200 p-6 transition hover:border-indigo-300 hover:shadow-md"
                >
                  <span className="text-lg font-semibold text-slate-900">{f.title}</span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{f.body}</span>
                  <span className="mt-4 text-sm font-medium text-indigo-600">자세히 보기 →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
