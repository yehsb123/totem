import { describe, expect, it } from "vitest";
import { authed, signup, useDb } from "./helpers";

useDb();

describe("투어 목록 필터·페이지", () => {
  it("검색·타입·상태·날짜를 함께 걸면 모두 만족하는 것만, 페이지 정보는 필터 기준", async () => {
    const api = authed((await signup()).token);
    const mk = (title: string, type: string, status: string, startDate: string, endDate = startDate) =>
      api.post("/tours", { title, type, status, startDate, endDate }).then((r) => expect(r.status).toBe(201));
    await mk("제주 (동부) 패키지", "패키지", "planned", "2026-10-01", "2026-10-03");
    await mk("제주 서부 패키지", "패키지", "planned", "2026-10-02");
    await mk("제주 동부 자유", "자유", "planned", "2026-10-02");
    await mk("제주 동부 패키지 종료", "패키지", "completed", "2026-10-02");
    for (let i = 0; i < 5; i++) await mk(`기타 ${i}`, "일반", "planned", "2026-11-01");

    const r = (await api.get(`/tours?q=${encodeURIComponent("동부")}&type=${encodeURIComponent("패키지")}&status=planned&date=2026-10-02`)).body;
    expect(r.data.map((t: { title: string }) => t.title)).toEqual(["제주 (동부) 패키지"]);
    expect(r.meta).toMatchObject({ total: 1, totalPages: 1 });

    // 정규식 특수문자는 글자 그대로 검색 (오류·전체 일치 없음)
    const paren = (await api.get(`/tours?q=${encodeURIComponent("(동부)")}`)).body;
    expect(paren.data.map((t: { title: string }) => t.title)).toEqual(["제주 (동부) 패키지"]);
    expect((await api.get(`/tours?q=${encodeURIComponent(".*")}`)).body.meta.total).toBe(0);

    const paged = (await api.get("/tours?type=일반&limit=2&page=3")).body;
    expect(paged.data).toHaveLength(1);
    expect(paged.meta).toMatchObject({ page: 3, limit: 2, total: 5, totalPages: 3 });
    expect((await api.get("/tours?type=일반&limit=2&page=9")).body.data).toHaveLength(0); // 없는 페이지는 빈 목록(화면이 앞 페이지로 돌아감)
  });
});
