import { z } from "zod";
import { isoMonth } from "./common";

/**
 * 대시보드 = 지역(제주) 관광 통계. 조직과 무관한 공용 데이터라 조직 스코프가 없다.
 * 월 1건 문서(tourism_stats)에 화면 6개 탭이 쓰는 값을 모두 담는다.
 */
const nameValue = z.object({ name: z.string(), value: z.number() });
const categoryAmount = z.object({ category: z.string(), amount: z.number() });

export const monthlyTourismStats = z.object({
  region: z.string(),
  month: isoMonth,
  /** 방문자 통계(국내) */
  domesticVisitors: z.number(),
  genderAge: z.array(z.object({ ageGroup: z.string(), maleRatio: z.number(), femaleRatio: z.number() })),
  /** 국가별 관광 방문객 수 */
  internationalVisitors: z.number(),
  countryRatios: z.array(z.object({ country: z.string(), ratio: z.number() })),
  /** 소셜미디어 언급량 */
  snsMentions: z.number(),
  companionTypes: z.array(nameValue),
  travelTypes: z.array(nameValue),
  /** 관광소비(국내·국외) — 단위: 천원 (원본 데이터 기준) */
  domesticSpending: z.object({ total: z.number(), byCategory: z.array(categoryAmount) }),
  internationalSpending: z.object({ total: z.number(), byCategory: z.array(categoryAmount) }),
  source: z.string(),
});
export type MonthlyTourismStats = z.infer<typeof monthlyTourismStats>;

export const dashboardQuery = z.object({
  region: z.string().default("jeju"),
  from: isoMonth.optional(),
  to: isoMonth.optional(),
});
export type DashboardQuery = z.input<typeof dashboardQuery>;

export const overviewQuery = z.object({
  region: z.string().default("jeju"),
  month: isoMonth,
});
export type OverviewQuery = z.input<typeof overviewQuery>;

/** GET /dashboard/overview — 종합 현황판 상단 카드 */
export interface DashboardOverview {
  month: string;
  totalVisitors: number;
  domesticVisitors: number;
  internationalVisitors: number;
  totalTourismSpending: number;
  snsMentions: number;
  /** 방문객 비중 상위 3개국 */
  topOverseasMarkets: string[];
  /** 전월 대비 증감률(%) — 전월 데이터가 없으면 null */
  change: {
    totalVisitors: number | null;
    totalTourismSpending: number | null;
    snsMentions: number | null;
  };
}

/** GET /dashboard/months — 데이터가 있는 월 목록 (월 선택기 범위) */
export interface DashboardMonths {
  region: string;
  months: string[];
}
