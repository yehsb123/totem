import { describe, expect, it } from "vitest";
import { DEFAULT_TIME_SLOTS } from "@totem/shared";
import { authed, signup, useDb } from "./helpers";

useDb();

describe("투어 ↔ 연결된 일정", () => {
  it("투어의 날짜·이름·담당자를 바꾸면 달력의 연결 일정도 따라간다 (일정에서 따로 고친 이름은 유지)", async () => {
    const api = authed((await signup()).token);
    const spot = (await api.get("/places?category=attraction&limit=1")).body.data[0];
    const created = await api.post("/courses", {
      title: "동부 코스",
      startDate: "2026-11-01",
      endDate: "2026-11-01",
      timeSlots: [...DEFAULT_TIME_SLOTS],
      days: [{ dayNumber: 1, date: "2026-11-01", slots: [{ slotIndex: 3, place: { placeId: spot.id, contentId: spot.contentId, title: spot.title, addr1: spot.addr1, category: spot.category, mapX: spot.mapX, mapY: spot.mapY, imageUrl: spot.imageUrl } }] }],
      tour: { type: "일반", managerName: "김가이드", capacity: 10 },
    });
    expect(created.status).toBe(201);
    const tourId = created.body.data.tour.id;
    const events = () => api.get("/schedule/events?from=2026-01-01&to=2026-12-31").then((r) => r.body.data.filter((e: { tourId: string | null }) => e.tourId === tourId));
    expect(await events()).toMatchObject([{ name: "동부 코스", startDate: "2026-11-01", endDate: "2026-11-01", manager: "김가이드" }]);

    expect((await api.patch(`/tours/${tourId}`, { title: "동부 코스 (변경)", startDate: "2026-11-05", endDate: "2026-11-06", managerName: "이가이드" })).status).toBe(200);
    expect(await events()).toMatchObject([{ name: "동부 코스 (변경)", startDate: "2026-11-05", endDate: "2026-11-06", manager: "이가이드" }]);

    // 일정에서 이름을 따로 고치면, 이후 투어 이름을 바꿔도 그 이름은 유지 (날짜는 계속 따라감)
    const [ev] = await events();
    await api.patch(`/schedule/events/${ev.id}`, { name: "VIP 동부 투어" });
    await api.patch(`/tours/${tourId}`, { title: "동부 코스 v3", startDate: "2026-11-10", endDate: "2026-11-10" });
    expect(await events()).toMatchObject([{ name: "VIP 동부 투어", startDate: "2026-11-10", endDate: "2026-11-10" }]);
  });
});
