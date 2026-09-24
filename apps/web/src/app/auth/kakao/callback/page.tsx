import type { Metadata } from "next";
import { Suspense } from "react";
import KakaoCallback, { CallbackPending } from "./KakaoCallback";

export const metadata: Metadata = {
  title: "카카오 로그인",
  robots: { index: false, follow: false },
};

export default function KakaoCallbackPage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <Suspense fallback={<CallbackPending />}>
        <KakaoCallback />
      </Suspense>
    </section>
  );
}
