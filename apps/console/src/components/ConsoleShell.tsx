"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Book, CalendarDays, LayoutDashboard, LogOut, Map, Menu, Settings, Star, X } from "lucide-react";
import { USER_ROLE_LABELS } from "@totem/shared";
import { asset } from "@/lib/env";
import { useSession } from "@/lib/session";

export const MENUS = [
  { href: "/schedule/", label: "일정관리", Icon: CalendarDays },
  { href: "/dashboard/", label: "대시보드", Icon: LayoutDashboard },
  { href: "/coursemaker/", label: "코스메이커", Icon: Map },
  { href: "/tours/", label: "투어관리", Icon: Book },
  { href: "/reviews/", label: "리뷰관리", Icon: Star },
  { href: "/settings/", label: "설정", Icon: Settings },
] as const;

export default function ConsoleShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => pathname.startsWith(href.replace(/\/$/, ""));
  const current = MENUS.find((m) => isActive(m.href));

  const nav = (
    <nav className="flex flex-col">
      {MENUS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 border-b border-blue-400/40 px-5 py-3.5 text-[15px] text-white transition-colors lg:flex-col lg:gap-1 lg:px-2 lg:py-4 ${
            isActive(href) ? "bg-blue-700/60 font-semibold" : "hover:bg-blue-600/60"
          }`}
        >
          <Icon className="h-6 w-6" aria-hidden />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex h-14 items-center gap-2 bg-white px-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- 정적 export + basePath 에서 가장 단순하고 확실한 방법 */}
      <img src={asset("/totem-logo.png")} alt="" width={32} height={32} />
      <span className="text-2xl font-extrabold tracking-tight text-black">ToTem</span>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden w-[180px] flex-shrink-0 flex-col bg-blue-500 lg:flex">
        {brand}
        {nav}
      </aside>

      {/* 모바일 사이드바 */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 bg-blue-500 transition-transform lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between bg-white pr-2">
          {brand}
          <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-600" aria-label="메뉴 닫기">
            <X className="h-5 w-5" />
          </button>
        </div>
        {nav}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-700 lg:hidden" aria-label="메뉴 열기">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">{current?.label ?? ""}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">
              {user.organization.name} · <strong className="font-semibold text-slate-800">{user.name}</strong>님
              <span className="ml-1 text-xs text-slate-400">({USER_ROLE_LABELS[user.role]})</span>
            </span>
            <button onClick={logout} className="flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200">
              <LogOut className="h-4 w-4" aria-hidden />
              로그아웃
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
