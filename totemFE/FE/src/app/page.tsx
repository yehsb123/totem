"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // mainpage로 리다이렉트
    router.push("/mainpage");
  }, [router]);

  return (
    <div style={{ 
      width: "100%", 
      height: "100vh", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#fff",
      fontSize: "18px"
    }}>
      리다이렉트 중...
    </div>
  );
}
