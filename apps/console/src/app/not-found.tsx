"use client";

import Link from "next/link";
import { btn } from "@/components/ui";
import { env } from "@/lib/env";

/**
 * 없는 콘솔 주소. GitHub Pages 는 모든 없는 경로에 이 페이지(404.html)를 보여 준다.
 * (없으면 Next 기본 영어 "404 This page could not be found." 에 돌아갈 길이 없다 — AUDIT §20)
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="text-xl font-semibold text-slate-800">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-slate-600">주소가 바뀌었거나 잘못 입력되었습니다.</p>
      <div className="flex gap-2">
        <Link href="/schedule/" className={btn.primary}>
          콘솔 첫 화면으로
        </Link>
        <a href={env.webUrl} className={btn.secondary}>
          ToTem 메인
        </a>
      </div>
    </main>
  );
}
