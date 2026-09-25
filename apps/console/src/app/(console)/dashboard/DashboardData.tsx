"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MonthlyTourismStats } from "@totem/shared";

/**
 * API 의 월별 통계(MonthlyTourismStats[]) → 기존 차트 컴포넌트가 쓰던 모양으로 변환.
 * 구 버전은 이 값들이 콘솔 소스에 하드코딩돼 있었다(dashboard/data/*.ts). 이제 DB(tourism_stats)가 출처다.
 */
export function buildDashboardData(stats: MonthlyTourismStats[]) {
  const sorted = [...stats].sort((a, b) => a.month.localeCompare(b.month));
  const byMonth = new Map(sorted.map((s) => [s.month, s]));

  const monthlyVisitorsData = sorted.map((s) => ({ name: s.month, 방문자수: s.domesticVisitors }));
  const monthlyGenderAgeDistributionData = sorted.map((s) => ({ month: s.month, distribution: s.genderAge }));
  const monthlyInternationalVisitors = sorted.map((s) => ({ month: s.month, totalVisitors: s.internationalVisitors, countryRatios: s.countryRatios }));
  const jejuMentionsData = sorted.map((s) => ({ name: s.month, 언급량: s.snsMentions }));

  /** 같은 항목이 두 번 들어 있는 달이 있어(원본 데이터 — AUDIT §26) 항목별로 합쳐 막대·조각이 겹치지 않게 */
  const toBreakdown = (items: { category: string; amount: number }[]) => {
    const merged = new Map<string, number>();
    for (const c of items) merged.set(c.category, (merged.get(c.category) ?? 0) + c.amount);
    return [...merged].map(([category, spending]) => ({ category, spending }));
  };

  /** 선택한 달을 끝으로 최근 12개월 언급량 */
  const getJejuMentionsForChart = (month: string) => {
    const end = jejuMentionsData.findIndex((d) => d.name === month);
    if (end === -1) return jejuMentionsData.slice(-12);
    return jejuMentionsData.slice(Math.max(0, end - 11), end + 1);
  };
  const getCompanionTypeByMonth = (month: string) => byMonth.get(month)?.companionTypes ?? [];
  const getTravelTypeByMonth = (month: string) => byMonth.get(month)?.travelTypes ?? [];
  const getDomesticSpendingByMonth = (month: string) => toBreakdown(byMonth.get(month)?.domesticSpending.byCategory ?? []);
  const getInternationalSpendingByMonth = (month: string) => toBreakdown(byMonth.get(month)?.internationalSpending.byCategory ?? []);

  return {
    months: sorted.map((s) => s.month),
    monthlyVisitorsData,
    monthlyGenderAgeDistributionData,
    monthlyInternationalVisitors,
    jejuMentionsData,
    getJejuMentionsForChart,
    getCompanionTypeByMonth,
    getTravelTypeByMonth,
    getDomesticSpendingByMonth,
    getInternationalSpendingByMonth,
  };
}

export type DashboardData = ReturnType<typeof buildDashboardData>;

const Ctx = createContext<DashboardData | null>(null);

export function DashboardDataProvider({ value, children }: { value: DashboardData; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboardData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDashboardData 는 DashboardDataProvider 안에서만 쓸 수 있습니다.");
  return v;
}
