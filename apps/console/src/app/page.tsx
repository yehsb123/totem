"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** 정적 export 에서는 서버 redirect 를 쓸 수 없어 클라이언트에서 기본 화면으로 보낸다 */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/schedule/");
  }, [router]);
  return null;
}
