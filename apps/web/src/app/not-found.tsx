import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-slate-600">주소가 바뀌었거나 삭제된 페이지입니다.</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        홈으로 돌아가기
      </Link>
    </section>
  );
}
