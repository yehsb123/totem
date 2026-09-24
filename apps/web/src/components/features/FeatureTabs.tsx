"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURE_LINKS } from "@/lib/nav";

/** /features/* 상단 탭 (헤더 아래에 붙는다) */
export default function FeatureTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="서비스 소개"
      className="sticky top-16 z-40 border-b border-slate-200 bg-white"
    >
      <ul className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 text-sm sm:justify-center sm:gap-10 sm:px-6">
        {FEATURE_LINKS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap border-b-2 py-3 transition-colors ${
                  active ? "border-slate-900 font-bold text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
