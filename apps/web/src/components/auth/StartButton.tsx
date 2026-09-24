"use client";

import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

/** 서버 컴포넌트 페이지에서 쓰는 "무료로 시작하기" 버튼 */
export default function StartButton({ className, children }: { className?: string; children?: ReactNode }) {
  const { start } = useAuth();
  return (
    <button type="button" onClick={start} className={className}>
      {children ?? "무료로 시작하기"}
    </button>
  );
}
