import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import AuthProvider from "@/components/auth/AuthProvider";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { env } from "@/lib/env";
import "./globals.css";

const description =
  "ToTem 은 여행사를 위한 투어 운영 도구입니다. 코스메이커로 코스를 설계하고, 투어·일정·리뷰를 한곳에서 관리하며, 관광 데이터 대시보드로 트렌드를 확인하세요.";

/**
 * 공유 미리보기(og:image 등)의 절대 주소 기준.
 * NEXT_PUBLIC_SITE_URL 을 우선 쓰고, 비어 있으면 Vercel 이 빌드 때 넣어 주는 운영 도메인으로 대체한다.
 * (둘 다 없으면 localhost 가 박혀 카카오톡·슬랙 미리보기 이미지가 깨진다)
 */
function metadataBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) return env.siteUrl;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : env.siteUrl;
}

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl()),
  title: {
    default: "ToTem — 여행사를 위한 투어·코스 운영 도구",
    template: "%s | ToTem",
  },
  description,
  applicationName: "ToTem",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "ToTem",
    title: "ToTem — 여행사를 위한 투어·코스 운영 도구",
    description,
    // 공유 미리보기 전용 1200×630 (카카오톡·슬랙·페이스북 권장 비율)
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "ToTem — 고객을 위한 투어 코스를 만들어보세요" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.jpg"],
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
