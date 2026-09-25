"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DashboardOverview, MonthlyTourismStats } from "@totem/shared";
import { EmptyState, ErrorState, LoadingState, inputBase } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { formatMonthKo } from "@/lib/format";
import ComprehensiveDashboard from "./components/ComprehensiveDashboard";
import CountryTourismRatio from "./components/CountryTourismRatio";
import SocialMediaMentions from "./components/SocialMediaMentions";
import TourismConsumptionDomestic from "./components/TourismConsumptionDomestic";
import TourismConsumptionForeign from "./components/TourismConsumptionForeign";
import VisitorStatsDomestic from "./components/VisitorStatsDomestic";
import { menuItems } from "./constants";
import { DashboardDataProvider, buildDashboardData } from "./DashboardData";

export default function DashboardPage() {
  const [tab, setTab] = useState(menuItems[0].label);
  const [stats, setStats] = useState<MonthlyTourismStats[] | null>(null);
  const [month, setMonth] = useState<string>("");
  // 종합 카드는 "어느 달의 것인지" 와 함께 둔다 — 달을 바꾸면 비우지 않아도 이전 달 카드가 보이지 않는다
  const [overview, setOverview] = useState<{ month: string; data: DashboardOverview } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.dashboard
      .stats()
      .then((all) => {
        if (cancelled) return;
        setStats(all);
        // 기본값: 데이터가 있는 가장 최근 달 (구 버전은 2025-06 고정)
        setMonth((m) => m || all.at(-1)?.month || "");
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [retry]);

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    api.dashboard
      .overview({ month })
      .then((data) => !cancelled && setOverview({ month, data }))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [month]);

  const currentOverview = overview?.month === month ? overview.data : null;
  const retryLoad = () => {
    setError(null);
    setRetry((n) => n + 1);
  };

  const data = useMemo(() => (stats ? buildDashboardData(stats) : null), [stats]);

  if (error) return <ErrorState message={error} onRetry={retryLoad} />;
  if (!data) return <LoadingState />;
  if (data.months.length === 0) return <EmptyState text="관광 통계 데이터가 아직 준비되지 않았습니다. 잠시 후 다시 확인해주세요." />;

  const idx = data.months.indexOf(month);
  const go = (d: number) => {
    const next = data.months[idx + d];
    if (next) setMonth(next);
  };

  const content = () => {
    switch (tab) {
      case "방문자 통계(국내)":
        return <VisitorStatsDomestic selectedMonth={month} />;
      case "소셜미디어 언급량":
        return <SocialMediaMentions selectedMonth={month} />;
      case "관광소비(국내)":
        return <TourismConsumptionDomestic selectedMonth={month} />;
      case "관광소비(국외)":
        return <TourismConsumptionForeign internationalSpendingByMonth={data.getInternationalSpendingByMonth(month)} />;
      case "국가별 관광 방문객 수":
        return <CountryTourismRatio selectedMonth={month} />;
      default:
        return currentOverview ? <ComprehensiveDashboard summaryMetrics={currentOverview} selectedMonth={month} /> : <LoadingState />;
    }
  };

  return (
    <DashboardDataProvider value={data}>
      <div className="flex min-h-full flex-col bg-indigo-50">
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-2 shadow-sm">
          <div className="flex items-center overflow-hidden rounded-md border border-slate-300">
            <button className="p-2 hover:bg-slate-100 disabled:opacity-30" onClick={() => go(-1)} disabled={idx <= 0} aria-label="이전 달">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <select className={`${inputBase} w-40 rounded-none border-0`} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="월 선택">
              {data.months.map((m) => (
                <option key={m} value={m}>
                  {formatMonthKo(m)}
                </option>
              ))}
            </select>
            <button className="p-2 hover:bg-slate-100 disabled:opacity-30" onClick={() => go(1)} disabled={idx >= data.months.length - 1} aria-label="다음 달">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <span className="text-xs text-slate-500">
            제주 · 데이터 {formatMonthKo(data.months[0])} ~ {formatMonthKo(data.months.at(-1)!)}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4 md:flex-row">
          <nav className="flex gap-2 overflow-x-auto md:w-60 md:flex-shrink-0 md:flex-col">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setTab(item.label)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-md border bg-white px-3 py-3 text-left text-[15px] shadow-sm ${
                  tab === item.label ? "border-blue-400 font-semibold ring-1 ring-blue-400" : "border-slate-200"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="min-w-0 flex-1 rounded-lg bg-white p-4 shadow-sm md:p-6">{content()}</div>
        </div>
      </div>
    </DashboardDataProvider>
  );
}
