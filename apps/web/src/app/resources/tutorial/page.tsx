import type { Metadata } from "next";
import BackLink from "../BackLink";

export const metadata: Metadata = {
  title: "튜토리얼 영상",
  description: "TOTEM 주요 기능의 사용법을 영상으로 쉽게 따라 해보세요.",
  alternates: { canonical: "/resources/tutorial" },
};

/**
 * 영상이 준비되면 youtubeId 를 채우고 아래 VideoPlaceholder 자리에
 * https://www.youtube-nocookie.com/embed/<youtubeId> iframe 을 넣는다.
 */
const VIDEOS = [
  { title: "시작하기: 첫 번째 프로젝트 만들기", body: "가장 기본적인 사용법을 빠르게 익히는 영상입니다." },
  { title: "고급 기능 활용하기: 데이터 분석", body: "플랫폼의 데이터 분석 기능을 심도 있게 다룹니다." },
  { title: "팀원과 협업하기", body: "팀원과 효과적으로 협업하는 방법을 알려드립니다." },
] as const;

function VideoPlaceholder() {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-slate-200 text-slate-500">
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-10" aria-hidden>
        <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
      </svg>
      <span className="text-sm font-medium">영상 준비 중</span>
    </div>
  );
}

export default function TutorialPage() {
  return (
    <div className="bg-white px-4 py-20 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <BackLink />

        <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">튜토리얼 영상</h1>
        <p className="mb-12 mt-4 text-center text-base text-slate-600 sm:text-lg">
          플랫폼의 주요 기능을 영상으로 쉽게 따라 해보세요.
        </p>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {VIDEOS.map((v) => (
            <li key={v.title} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <VideoPlaceholder />
              <div className="p-4">
                <h2 className="mb-1 text-lg font-semibold text-slate-900">{v.title}</h2>
                <p className="text-sm text-slate-500">{v.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
