import { describe, expect, it } from "vitest";
import { tourismJeju } from "../src/db/seed/data/tourism-jeju";
import { authed, signup, useDb } from "./helpers";

useDb();

const sum = (items: { amount: number }[]) => items.reduce((n, c) => n + c.amount, 0);

describe("종합 현황판 숫자 = 원본 시드로 직접 계산한 값", () => {
  it("방문자·증감률은 내국인+외국인 기준, 소비액은 항목 합 (탭의 항목·비율과 같은 총액)", async () => {
    const api = authed((await signup()).token);
    const cur = tourismJeju.find((s) => s.month === "2025-06")!;
    const prev = tourismJeju.find((s) => s.month === "2025-05")!;
    const o = (await api.get("/dashboard/overview?region=jeju&month=2025-06")).body.data;

    const visitors = cur.domesticVisitors + cur.internationalVisitors;
    const prevVisitors = prev.domesticVisitors + prev.internationalVisitors;
    expect(o.totalVisitors).toBe(visitors);
    expect(o.change.totalVisitors).toBe(Math.round(((visitors - prevVisitors) / prevVisitors) * 1000) / 10); // -7.5
    expect(o.change.totalVisitors).toBe(-7.5);

    const spending = sum(cur.domesticSpending.byCategory) + sum(cur.internationalSpending.byCategory);
    expect(o.totalTourismSpending).toBe(spending);
    expect(o.topOverseasMarkets).toEqual(["중국", "대만", "미국"]); // "기타" 제외 상위 3
  });

  it("전월 데이터가 없는 첫 달은 증감률 null", async () => {
    const api = authed((await signup()).token);
    const o = (await api.get("/dashboard/overview?region=jeju&month=2024-07")).body.data;
    expect(o.change).toEqual({ totalVisitors: null, totalTourismSpending: null, snsMentions: null });
  });
});
