"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const menuItems = [
  { label: "코스메이커", path: "/mainpage/introduceservice/coursemaker" },
  { label: "대시보드", path: "/mainpage/introduceservice/dashboard" },
  { label: "투어관리", path: "/mainpage/introduceservice/tour" },
  { label: "일정관리", path: "/mainpage/introduceservice/schedule" },
  { label: "리뷰관리", path: "/mainpage/introduceservice/review" },
];

export default function IntroduceServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div>
      <div style={{ height: "0.052vw", backgroundColor: "#ddd" }} />

      <nav
        style={{
          position: "sticky",
          top: "2.604vw",
          zIndex: 40,
          height: "2.5vw",
          backgroundColor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "0.052vw solid #ddd",
        }}
      >
        <div style={{ display: "flex", gap: "2.083vw" }}>
          {" "}
          {menuItems.map((item) => {
            const isActive = isClient && pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  fontSize: "0.833vw",
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? "#000" : "#888",
                  borderBottom: isActive ? "0.104vw solid #000" : "none",
                  paddingBottom: "0.208vw",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main style={{ backgroundColor: "#5985e1", padding: "1.25vw" }}>
        {children}
      </main>
    </div>
  );
}
