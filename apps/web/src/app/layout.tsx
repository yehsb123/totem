import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import AuthProvider from "@/components/auth/AuthProvider";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { env } from "@/lib/env";
import "./globals.css";

const description =
  "ToTem 은 여행사를 위한 투어 운영 도구입니다. 코스메이커로 코스를 설계하고, 투어·일정·리뷰를 한곳에서 관리하며, 관광 데이터 대시보드로 트렌드를 확인하세요.";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "ToTem — 여행사를 위한 투어·코스 운영 도구",
    template: "%s | Totem",
  },
  description,
  applicationName: "ToTem",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "ToTem",
    title: "ToTem — 여행사를 위한 투어·코스 운영 도구",
    description,
    images: [{ url: "/hero-bg.png", width: 1536, height: 1024, alt: "ToTem" }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard (가변 폰트, 한글 동적 서브셋) */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-dvh flex-col bg-white text-slate-900 antialiased">
        <AuthProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
