"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FEATURE_LINKS, MAIN_LINKS } from "@/lib/nav";
import { useAuth } from "./auth/AuthProvider";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const { isLoggedIn, openAuth, start, goToConsole, logout } = useAuth();
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setFeaturesOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // 드롭다운 바깥 클릭·ESC 로 닫기
  useEffect(() => {
    if (!featuresOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setFeaturesOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFeaturesOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [featuresOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const featuresActive = pathname.startsWith("/features");

  const authButtons = (mobile: boolean) =>
    isLoggedIn ? (
      <>
        <button
          type="button"
          onClick={() => void logout()}
          className={`text-sm text-slate-600 hover:text-slate-900 ${mobile ? "py-2 text-left" : ""}`}
        >
          로그아웃
        </button>
        <button
          type="button"
          onClick={() => void goToConsole()}
          className="rounded-md bg-indigo-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-600"
        >
          콘솔로 이동
        </button>
      </>
    ) : (
      <>
        <button
          type="button"
          onClick={() => openAuth("login")}
          className={`text-sm text-slate-700 hover:text-slate-950 ${mobile ? "py-2 text-left" : ""}`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={start}
          className="rounded-md bg-indigo-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-600"
        >
          무료로 시작하기
        </button>
      </>
    );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="ToTem 홈">
          <Image src="/totem-logo.png" alt="" width={36} height={36} priority className="size-9" />
          <span className="text-xl font-extrabold tracking-tight text-slate-950">ToTem</span>
        </Link>

        {/* 데스크톱 내비게이션 */}
        <nav aria-label="주요 메뉴" className="hidden flex-1 items-center gap-7 text-sm text-slate-700 md:flex">
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              aria-expanded={featuresOpen}
              aria-haspopup="true"
              onClick={() => setFeaturesOpen((v) => !v)}
              className={`flex items-center gap-1 hover:text-slate-950 ${featuresActive ? "font-semibold text-slate-950" : ""}`}
            >
              서비스 소개 <Chevron open={featuresOpen} />
            </button>
            {featuresOpen && (
              <ul className="absolute left-0 top-full mt-2 min-w-40 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
                {FEATURE_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block whitespace-nowrap px-4 py-2 hover:bg-slate-50 ${
                        isActive(item.href) ? "font-semibold text-indigo-600" : "text-slate-700"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {MAIN_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`hover:text-slate-950 ${isActive(item.href) ? "font-semibold text-slate-950" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">{authButtons(false)}</div>

        {/* 모바일 메뉴 토글 */}
        <button
          type="button"
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-6" aria-hidden>
            {mobileOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white md:hidden">
          <nav aria-label="모바일 메뉴" className="mx-auto flex max-w-6xl flex-col px-4 py-3 text-sm text-slate-700">
            <p className="pb-1 pt-2 text-xs font-semibold text-slate-400">서비스 소개</p>
            {FEATURE_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`py-2 ${isActive(item.href) ? "font-semibold text-indigo-600" : ""}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-slate-100" />
            {MAIN_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`py-2 ${isActive(item.href) ? "font-semibold text-slate-950" : ""}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-slate-100" />
            <div className="flex flex-col gap-2 pb-2">{authButtons(true)}</div>
          </nav>
        </div>
      )}
    </header>
  );
}
