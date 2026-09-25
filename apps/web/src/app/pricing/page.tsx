import type { Metadata } from "next";
import StartButton from "@/components/auth/StartButton";

export const metadata: Metadata = {
  title: "요금제 안내",
  description: "여행사를 위한 ToTem 요금제. Basic ₩29,000/월부터 코스 설계·투어 일정 PDF·관광 데이터 대시보드·투어/리뷰 관리를 제공합니다.",
  alternates: { canonical: "/pricing" },
};

const PLANS = [
  {
    name: "Basic",
    price: "₩29,000",
    badge: null,
    highlight: false,
    features: ["일정/코스 설계 기능", "투어 일정 PDF 생성", "관광데이터랩 기반 대시보드", "투어/리뷰관리 기능"],
  },
  {
    name: "Pro",
    price: "₩59,000",
    badge: "출시 예정",
    highlight: true,
    features: [
      "모든 Basic 기능 포함",
      "가이드 매칭 시스템",
      "카카오톡 리마인더 (알림기능)",
      "전체 관리 고급 (태그/기록/생성 무제한)",
    ],
  },
] as const;

function Check() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 size-4 shrink-0 text-indigo-500" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <section className="bg-white px-4 py-20 text-slate-900 sm:px-6 sm:py-24">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">ToTem 요금제 안내</h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">당신의 여행사를 위한 유연한 요금제를 선택하세요.</p>
      </header>

      <ul className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
        {PLANS.map((plan) => (
          <li
            key={plan.name}
            className={`relative flex flex-col rounded-2xl bg-white p-7 shadow-sm ${
              plan.highlight ? "border-2 border-indigo-500" : "border border-slate-200"
            }`}
          >
            {plan.badge && (
              <span className="absolute right-5 top-5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                {plan.badge}
              </span>
            )}
            <h2 className={`text-xl font-bold ${plan.highlight ? "text-indigo-600" : ""}`}>{plan.name}</h2>
            <p className="mt-3">
              <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
              <span className="ml-1 text-sm text-slate-500">/월</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-700">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="mt-12 text-center">
        <StartButton className="rounded-full bg-indigo-500 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-indigo-600" />
        {/* 실제 동작: 가입하면 무료 체험 요금제로 시작(콘솔 결제 정보 "무료 체험"), 결제는 PG 연동 후 — DECISIONS 참고 */}
        <p className="mt-4 text-sm text-slate-600">가입하면 무료 체험으로 바로 시작합니다. 유료 요금제 전환은 결제 연동 후 안내해 드립니다.</p>
        <p className="mt-2 text-sm text-slate-500">* 모든 요금제는 부가세(VAT) 별도입니다.</p>
      </div>
    </section>
  );
}
