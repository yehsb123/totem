import type { Metadata } from "next";
import { Suspense } from "react";
import InviteAccept from "./InviteAccept";

export const metadata: Metadata = {
  title: "초대 수락",
  robots: { index: false, follow: false },
};

export default function InvitePage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <Suspense fallback={<p className="text-center text-sm text-slate-500">초대 정보를 확인하는 중…</p>}>
          <InviteAccept />
        </Suspense>
      </div>
    </section>
  );
}
