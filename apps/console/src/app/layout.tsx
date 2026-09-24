import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { KAKAO_MAP_SCRIPT_SRC, buildCsp } from "@totem/shared/csp";
import { ToastProvider } from "@/components/ui";
import { env } from "@/lib/env";

/**
 * GitHub Pages 는 응답 헤더를 못 바꾸므로 CSP 를 <meta> 로 넣는다 (docs/SECURITY.md R2).
 * 운영 빌드에만 — 개발 서버는 HMR 이 eval·웹소켓을 쓴다. frame-ancestors 는 메타로 불가(맞교환 기록).
 */
const csp =
  process.env.NODE_ENV === "production"
    ? buildCsp({ apiOrigin: env.apiBaseUrl, scriptSrc: KAKAO_MAP_SCRIPT_SRC, forMeta: true })
    : null;

export const metadata: Metadata = {
  title: { default: "Totem 콘솔", template: "%s | Totem 콘솔" },
  description: "투어·코스 운영 관리 콘솔",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>{csp && <meta httpEquiv="Content-Security-Policy" content={csp} />}</head>
      <body className="bg-slate-100 text-slate-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
