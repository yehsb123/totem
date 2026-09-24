import type { ReactNode } from "react";
import StartButton from "@/components/auth/StartButton";
import FeatureTabs from "@/components/features/FeatureTabs";

export default function FeaturesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FeatureTabs />
      <div className="bg-brand-sky px-4 pb-20 pt-16 text-white sm:px-6 sm:pt-20">
        {children}
        <div className="mt-20 text-center">
          <StartButton className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100" />
        </div>
      </div>
    </>
  );
}
