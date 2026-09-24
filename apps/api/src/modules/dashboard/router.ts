import { Router } from "express";
import { ROUTES, dashboardQuery, overviewQuery, type DashboardOverview } from "@totem/shared";
import { ok, parse } from "../../lib/http";
import { TourismStat } from "../../db/models";
import { toTourismStats } from "../../db/serialize";
import { requireAuth } from "../../middlewares/auth";

/** 대시보드 — 지역 관광 통계 (조직 무관 공용 데이터, 로그인 사용자만) */
export const dashboardRouter = Router();
dashboardRouter.use("/dashboard", requireAuth);

dashboardRouter.get(ROUTES.dashboard.months, async (req, res) => {
  const { region } = parse(dashboardQuery, req.query);
  const months = (await TourismStat.distinct("month", { region })) as string[];
  ok(res, { region, months: months.sort() });
});

dashboardRouter.get(ROUTES.dashboard.stats, async (req, res) => {
  const q = parse(dashboardQuery, req.query);
  const filter: Record<string, unknown> = { region: q.region };
  if (q.from || q.to) filter.month = { ...(q.from && { $gte: q.from }), ...(q.to && { $lte: q.to }) };
  const stats = await TourismStat.find(filter).sort({ month: 1 }).lean();
  ok(res, stats.map(toTourismStats));
});

function previousMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return d.toISOString().slice(0, 7);
}

const pct = (cur: number, prev: number | undefined) =>
  prev === undefined || prev === 0 ? null : Math.round(((cur - prev) / prev) * 1000) / 10;

/** 종합 현황판 상단 카드 */
dashboardRouter.get(ROUTES.dashboard.overview, async (req, res) => {
  const { region, month } = parse(overviewQuery, req.query);
  const [cur, prev] = await Promise.all([
    TourismStat.findOne({ region, month }).lean(),
    TourismStat.findOne({ region, month: previousMonth(month) }).lean(),
  ]);

  const summarize = (s: typeof cur) => {
    const domestic = s?.domesticVisitors ?? 0;
    const international = s?.internationalVisitors ?? 0;
    return {
      domestic,
      international,
      visitors: domestic + international,
      spending: (s?.domesticSpending?.total ?? 0) + (s?.internationalSpending?.total ?? 0),
      sns: s?.snsMentions ?? 0,
    };
  };
  const c = summarize(cur);
  const p = prev ? summarize(prev) : null;

  const overview: DashboardOverview = {
    month,
    totalVisitors: c.visitors,
    domesticVisitors: c.domestic,
    internationalVisitors: c.international,
    totalTourismSpending: c.spending,
    snsMentions: c.sns,
    topOverseasMarkets: [...(cur?.countryRatios ?? [])]
      .filter((r) => r.country && r.country !== "기타")
      .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0))
      .slice(0, 3)
      .map((r) => r.country!),
    change: {
      totalVisitors: pct(c.visitors, p?.visitors),
      totalTourismSpending: pct(c.spending, p?.spending),
      snsMentions: pct(c.sns, p?.sns),
    },
  };
  ok(res, overview);
});
