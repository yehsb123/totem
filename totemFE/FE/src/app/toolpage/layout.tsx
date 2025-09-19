"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  Menu,
  CalendarDays,
  LayoutDashboard,
  Map,
  Book,
  Star,
  Settings,
} from "lucide-react";

const iconMap = {
  calendar_month: CalendarDays,
  dashboard: LayoutDashboard,
  map: Map,
  book: Book,
  rate_review: Star,
  settings: Settings,
};

const menus = [
  { icon: "calendar_month", label: "일정관리", href: "/toolpage/schedule" },
  { icon: "dashboard", label: "대시보드", href: "/toolpage/dashboard" },
  { icon: "map", label: "코스메이커", href: "/toolpage/coursemaker" },
  { icon: "book", label: "투어관리", href: "/toolpage/tour" },
  { icon: "rate_review", label: "리뷰관리", href: "/toolpage/review" },
  { icon: "settings", label: "설정", href: "/toolpage/setting" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentMenu = menus.find((menu) => pathname.startsWith(menu.href));
  const currentLabel = currentMenu?.label || "";

  const handleLogout = () => {
    alert("로그아웃 되었습니다.");
    router.push("/mainpage");
  };

  const MobileIconComponent = ({ iconName }: { iconName: string }) => {
    const LucideIcon = iconMap[iconName as keyof typeof iconMap];
    return <LucideIcon className="w-6 h-6 mr-4" />;
  };

  return (
    <div
      className="flex min-h-screen relative"
      style={{ backgroundColor: "#D9D9D9", fontFamily: "sans-serif" }}
    >
      <div className="lg:hidden fixed top-0 left-0 w-full h-16 bg-white flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/TOTEM%20로고.png" alt="ToTem" width={32} height={32} />
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-700"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 h-full bg-blue-500 text-white z-50 flex flex-col transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-3 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <Image src="/TOTEM%20로고.png" alt="ToTem" width={40} height={40} />
            <span className="font-bold text-3xl text-black">ToTem</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-gray-700"
          ></button>
        </div>
        <nav className="flex-1 overflow-y-auto mt-2">
          {menus.map((item, i) => (
            <Link
              href={item.href}
              key={i}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div
                className={`
                  flex items-center px-6 py-4 text-white text-lg font-medium transition-colors
                  border-b border-blue-400 hover:bg-blue-600
                  ${
                    pathname.startsWith(item.href)
                      ? "bg-blue-600 font-semibold shadow-inner"
                      : ""
                  }
                `}
              >
                <MobileIconComponent iconName={item.icon} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      <div
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{ width: "180px", backgroundColor: "#61AEFA" }}
      >
        <div
          style={{
            height: "5vh",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            paddingLeft: "10px",
          }}
        >
          <Image src="/TOTEM%20로고.png" alt="ToTem" width={40} height={60} />
          <span
            style={{
              fontWeight: "1000",
              fontSize: "30px",
              marginLeft: "6px",
              color: "#000",
            }}
          >
            ToTem
          </span>
        </div>
        <div style={{ paddingTop: "0px" }}>
          {menus.map((item, i) => (
            <Link href={item.href} key={i}>
              <div
                style={{
                  all: "unset",
                  width: "100%",
                  borderBottom: "1px solid #5096DB",
                  padding: "15px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  color: "#ffffff",
                  fontSize: "17px",
                  cursor: "pointer",
                  backgroundColor: pathname.startsWith(item.href)
                    ? "#4C97E3"
                    : "transparent",
                  textShadow: pathname.startsWith(item.href)
                    ? "0px 1px 2px rgba(0, 0, 0, 0.4)"
                    : "none",
                }}
              >
                <div style={{ fontSize: "30px" }}>
                  <span className="material-icons" style={{ color: "white" }}>
                    {item.icon}
                  </span>
                </div>
                <div>{item.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          className="hidden lg:flex"
          style={{
            height: "5vh",
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <span style={{ fontSize: "14px", color: "#555", marginRight: "1px" }}>
            환영합니다, 사용자님!
          </span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#E0E0E0",
              color: "#333",
              border: "none",
              borderRadius: "4px",
              padding: "5px 10px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </div>

        <div
          className="hidden lg:flex"
          style={{
            height: "8vh",
            backgroundColor: "#A5D2FF",
            alignItems: "center",
            padding: "0 1.5vw",
          }}
        >
          <span
            style={{
              fontSize: "35px",
              fontWeight: "bold",
              color: "#000000",
              marginLeft: "0.25vw",
            }}
          >
            {currentLabel}
          </span>
        </div>

        <div className="flex-1 overflow-auto min-h-0 pt-16 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
