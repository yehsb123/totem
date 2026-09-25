import { beforeEach, describe, expect, it, vi } from "vitest";

// 다운로드(허용 호스트·https)는 따로 검증되므로 여기서는 CSV 본문만 바꿔 끼운다
const csvBody = { text: "" };
vi.mock("../src/modules/reviews/csv", async (orig) => ({
  ...(await orig<typeof import("../src/modules/reviews/csv")>()),
  downloadCsv: async () => csvBody.text,
}));

const { authed, signup, useDb } = await import("./helpers");
useDb();

const URL_ = "https://docs.google.com/spreadsheets/d/X/edit";

describe("리뷰 CSV 가져오기", () => {
  let api: ReturnType<typeof authed>;
  let tourId: string;
  beforeEach(async () => {
    api = authed((await signup()).token);
    tourId = (await api.post("/tours", { title: "가져오기 투어", startDate: "2026-10-01", endDate: "2026-10-01" })).body.data.id;
  });

  it("날짜 열이 없는 시트를 다시 가져와도 중복으로 쌓이지 않는다", async () => {
    csvBody.text = "총점,코멘트,작성자\n5,좋아요,김\n4,괜찮아요,이\n9,범위 밖,박\n";
    const first = (await api.post(`/tours/${tourId}/reviews/import`, { csvUrl: URL_ })).body.data;
    expect(first).toMatchObject({ totalRows: 3, imported: 2, skipped: 1 });
    await new Promise((r) => setTimeout(r, 20)); // "지금" 시각이 달라지도록
    const second = (await api.post(`/tours/${tourId}/reviews/import`, { csvUrl: URL_ })).body.data;
    expect(second).toMatchObject({ totalRows: 3, imported: 0, skipped: 3 });
    expect(second.errors.filter((e: { message: string }) => e.message === "이미 가져온 리뷰입니다.")).toHaveLength(2);
    const tour = (await api.get(`/tours/${tourId}`)).body.data;
    expect(tour.reviewStats.reviewCount).toBe(2);
  });

  it("수천 행도 한 번에 넣고, 이미 있는 행만 건너뛴다 (행 번호 정확)", async () => {
    const rows = Array.from({ length: 3000 }, (_, i) => `${(i % 5) + 1},후기 ${i},작성자${i}`);
    csvBody.text = `총점,코멘트,작성자\n${rows.slice(0, 1000).join("\n")}\n`;
    expect((await api.post(`/tours/${tourId}/reviews/import`, { csvUrl: URL_ })).body.data.imported).toBe(1000);

    csvBody.text = `총점,코멘트,작성자\n${rows.join("\n")}\n`;
    const started = Date.now();
    const r = (await api.post(`/tours/${tourId}/reviews/import`, { csvUrl: URL_ })).body.data;
    const ms = Date.now() - started;
    expect(r).toMatchObject({ totalRows: 3000, imported: 2000, skipped: 1000 });
    expect(r.errors).toHaveLength(100); // 앞 100건만
    expect(r.errors[0]).toEqual({ row: 2, message: "이미 가져온 리뷰입니다." });
    expect((await api.get(`/tours/${tourId}`)).body.data.reviewStats.reviewCount).toBe(3000);
    expect(ms).toBeLessThan(5000);
  });
});
