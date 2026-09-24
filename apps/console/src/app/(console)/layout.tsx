import type { ReactNode } from "react";
import ConsoleShell from "@/components/ConsoleShell";
import { SessionProvider } from "@/lib/session";

/** 로그인이 필요한 모든 기능 화면의 공통 레이아웃 */
export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ConsoleShell>{children}</ConsoleShell>
    </SessionProvider>
  );
}
