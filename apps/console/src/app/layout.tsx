import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/ui";

export const metadata: Metadata = {
  title: { default: "Totem 콘솔", template: "%s | Totem 콘솔" },
  description: "투어·코스 운영 관리 콘솔",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
