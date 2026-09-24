import { describe, expect, it } from "vitest";
import { DEFAULT_TIME_SLOTS, HOTEL_SLOT_INDEX } from "@totem/shared";
import { authed, signup, useDb } from "./helpers";
import { mapRows, parseCsv, toCsvExportUrl } from "../src/modules/reviews/csv";

useDb();

async function pickPlaces(api: ReturnType<typeof authed>) {
  const hotel = (await api.get("/places?category=hotel&limit=1")).body.data[0];
  const spot = (await api.get("/places?category=attraction&limit=1")).body.data[0];
  const snap = (p: { id: string; contentId: string; title: string; addr1: string; category: string; mapX: number; mapY: number; imageUrl: string | null }) => ({
    placeId: p.id,
    contentId: p.contentId,
    title: p.title,
    addr1: p.addr1,
    category: p.category,
    mapX: p.mapX,
    mapY: p.mapY,
    imageUrl: p.imageUrl,
  });
  return { hotel: snap(hotel), spot: snap(spot) };
}

const course = (days: object[], extra: object = {}) => ({
  title: "테스트 코스",
  startDate: "2026-10-01",
  endDate: "2026-10-02",
  timeSlots: [...DEFAULT_TIME_SLOTS],
  days,
  ...extra,
});

describe("코스메이커 규칙", () => {
  it("정상 코스 저장 + 투어 동시 생성 + 장소 인기도 증가", async () => {
    const api = authed((await signup()).token);
    const { hotel, spot } = await pickPlaces(api);
    const before = (await api.get(`/places/${spot.placeId}`)).body.data.popularity;
    const res = await api.post(
      "/courses",
      course(
        [
          { dayNumber: 1, date: "2026-10-01", slots: [{ slotIndex: HOTEL_SLOT_INDEX, place: hotel }, { slotIndex: 3, place: spot }] },
          { dayNumber: 2, date: "2026-10-02", slots: [] },
        ],
        { tour: { type: "패키지", managerName: "김가이드", capacity: 10 } },
      ),
    );
    expect(res.status).toBe(201);
    expect(res.body.data.course.tourIds).toHaveLength(1);
    expect(res.body.data.tour.status).toBe("planned");
    expect((await api.get(`/places/${spot.placeId}`)).body.data.popularity).toBe(before + 1);

    // 투어로 등록하면 일정관리 달력에도 '투어' 라벨로 올라간다 (숙소 칸 제외, 시간대 시작 시각)
    const events = (await api.get("/schedule/events?from=2026-10-01&to=2026-10-31")).body.data;
    const labels = (await api.get("/schedule/labels")).body.data;
    expect(events).toHaveLength(1);
    expect(events[0].tourId).toBe(res.body.data.tour.id);
    expect(events[0].labelId).toBe(labels.find((l: { name: string }) => l.name === "투어").id);
    expect(events[0].items).toEqual([{ time: "09:00", place: spot.title }]);
  });

  it("숙소를 일반 시간대에, 일반 장소를 숙소 시간대에 넣으면 400", async () => {
    const api = authed((await signup()).token);
    const { hotel, spot } = await pickPlaces(api);
    const hotelInDay = await api.post("/courses", course([{ dayNumber: 1, date: "2026-10-01", slots: [{ slotIndex: 2, place: hotel }] }, { dayNumber: 2, date: "2026-10-02", slots: [] }]));
    const spotInHotel = await api.post("/courses", course([{ dayNumber: 1, date: "2026-10-01", slots: [{ slotIndex: HOTEL_SLOT_INDEX, place: spot }] }, { dayNumber: 2, date: "2026-10-02", slots: [] }]));
    expect(hotelInDay.status).toBe(400);
    expect(spotInHotel.status).toBe(400);
  });

  it("기간과 일차가 안 맞거나 장소가 없으면 400, 당일 코스는 허용", async () => {
    const api = authed((await signup()).token);
    const { spot } = await pickPlaces(api);
    expect((await api.post("/courses", course([{ dayNumber: 1, date: "2026-10-01", slots: [{ slotIndex: 1, place: spot }] }]))).status).toBe(400);
    expect((await api.post("/courses", course([{ dayNumber: 1, date: "2026-10-01", slots: [] }, { dayNumber: 2, date: "2026-10-02", slots: [] }]))).status).toBe(400);
    const sameDay = await api.post("/courses", course([{ dayNumber: 1, date: "2026-10-01", slots: [{ slotIndex: 1, place: spot }] }], { endDate: "2026-10-01" }));
    expect(sameDay.status).toBe(201);
  });
});

describe("코스 삭제", () => {
  it("연결된 투어가 있으면 409, 투어를 지우면 삭제되고 목록·상세에서 사라진다", async () => {
    const api = authed((await signup()).token);
    const { spot } = await pickPlaces(api);
    const r = await api.post("/courses", course([{ dayNumber: 1, date: "2026-10-01", slots: [{ slotIndex: 2, place: spot }] }], { endDate: "2026-10-01", tour: { capacity: 5 } }));
    const courseId = r.body.data.course.id;
    expect((await api.get("/courses")).body.data[0]).toMatchObject({ id: courseId, tourCount: 1, placeCount: 1 });
    const del1 = await api.delete(`/courses/${courseId}`);
    expect(del1.status).toBe(409);
    expect(del1.body.error.details.tourCount).toBe(1);
    await api.delete(`/tours/${r.body.data.tour.id}`);
    expect((await api.delete(`/courses/${courseId}`)).status).toBe(204);
    expect((await api.get(`/courses/${courseId}`)).status).toBe(404);
    expect((await api.get("/courses")).body.data).toHaveLength(0);
  });
});

describe("조직 격리", () => {
  it("다른 조직의 투어는 보이지도, 수정되지도 않는다", async () => {
    const a = authed((await signup()).token);
    const b = authed((await signup()).token);
    const t = (await a.post("/tours", { title: "A투어", startDate: "2026-10-01", endDate: "2026-10-01" })).body.data;
    expect((await b.get("/tours")).body.data).toHaveLength(0);
    expect((await b.get(`/tours/${t.id}`)).status).toBe(404);
    expect((await b.patch(`/tours/${t.id}`, { status: "canceled" })).status).toBe(404);
    expect((await b.get(`/tours/${t.id}/reviews`)).status).toBe(404);
  });
});

describe("투어관리·리뷰", () => {
  it("좌석 인라인 수정은 기존 값과 합쳐서 검증한다", async () => {
    const api = authed((await signup()).token);
    const t = (await api.post("/tours", { title: "T", startDate: "2026-10-01", endDate: "2026-10-02", capacity: 10 })).body.data;
    expect((await api.patch(`/tours/${t.id}`, { bookedSeats: 11 })).status).toBe(400);
    const ok = await api.patch(`/tours/${t.id}`, { bookedSeats: 7, status: "in_progress" });
    expect(ok.body.data.remainingSeats).toBe(3);
    expect((await api.get("/tours?status=in_progress")).body.data).toHaveLength(1);
    expect((await api.get("/tours?date=2026-10-02")).body.data).toHaveLength(1);
    expect((await api.get("/tours?date=2026-10-03")).body.data).toHaveLength(0);
  });

  it("리뷰 등록·삭제가 투어 평균에 반영된다", async () => {
    const api = authed((await signup()).token);
    const t = (await api.post("/tours", { title: "T", startDate: "2026-10-01", endDate: "2026-10-01" })).body.data;
    await api.post(`/tours/${t.id}/reviews`, { totalRating: 5 });
    const r2 = (await api.post(`/tours/${t.id}/reviews`, { totalRating: 2 })).body.data;
    expect((await api.get(`/tours/${t.id}`)).body.data.reviewStats).toEqual({ averageRating: 3.5, reviewCount: 2 });
    await api.delete(`/reviews/${r2.id}`);
    expect((await api.get(`/tours/${t.id}`)).body.data.reviewStats).toEqual({ averageRating: 5, reviewCount: 1 });
  });

  it("CSV 가져오기는 허용되지 않은 호스트를 거부한다 (SSRF 방지)", async () => {
    const api = authed((await signup()).token);
    const t = (await api.post("/tours", { title: "T", startDate: "2026-10-01", endDate: "2026-10-01" })).body.data;
    const res = await api.post(`/tours/${t.id}/reviews/import`, { csvUrl: "https://169.254.169.254.nip.io/latest" });
    expect(res.status).toBe(400);
  });
});

describe("CSV 파싱", () => {
  it("따옴표·쉼표·줄바꿈·한글 헤더를 처리하고 잘못된 행을 따로 모은다", () => {
    const csv = '타임스탬프,총점,식당,코멘트\n2025-06-01,5,4,"좋아요, 정말"\n2025-06-02,9,,"범위 밖"\n2025-06-03,4점,,"여러\n줄"\n';
    const { parsed, errors } = mapRows(parseCsv(csv));
    expect(parsed.map((p) => p.review.totalRating)).toEqual([5, 4]);
    expect(parsed[0].review.comment).toBe("좋아요, 정말");
    expect(parsed[1].review.comment).toBe("여러\n줄");
    expect(errors).toEqual([{ row: 3, message: expect.stringContaining("1~5") }]);
  });

  it("구글 시트 편집 URL 을 CSV 내보내기 URL 로 바꾼다", () => {
    expect(toCsvExportUrl("https://docs.google.com/spreadsheets/d/ABC123/edit#gid=42")).toBe(
      "https://docs.google.com/spreadsheets/d/ABC123/export?format=csv&gid=42",
    );
  });
});

describe("일정관리", () => {
  it("사용 중인 라벨 삭제는 409, reassignTo 로 옮기면 삭제된다", async () => {
    const api = authed((await signup()).token);
    const [l1, l2] = (await api.get("/schedule/labels")).body.data;
    await api.post("/schedule/events", { name: "E", startDate: "2026-10-01", endDate: "2026-10-02", labelId: l1.id });
    expect((await api.delete(`/schedule/labels/${l1.id}`)).status).toBe(409);
    expect((await api.delete(`/schedule/labels/${l1.id}?reassignTo=${l2.id}`)).status).toBe(204);
    const events = (await api.get("/schedule/events")).body.data;
    expect(events[0].labelId).toBe(l2.id);
  });

  it("달력 범위와 겹치는 일정만 온다", async () => {
    const api = authed((await signup()).token);
    await api.post("/schedule/events", { name: "9월말~10월초", startDate: "2026-09-29", endDate: "2026-10-02" });
    await api.post("/schedule/events", { name: "11월", startDate: "2026-11-05", endDate: "2026-11-05" });
    const oct = (await api.get("/schedule/events?from=2026-10-01&to=2026-10-31")).body.data;
    expect(oct.map((e: { name: string }) => e.name)).toEqual(["9월말~10월초"]);
    expect((await api.post("/schedule/events", { name: "x", startDate: "2026-10-02", endDate: "2026-10-01" })).status).toBe(400);
  });
});

describe("대시보드", () => {
  it("월 목록과 종합 카드(전월 대비 포함)", async () => {
    const api = authed((await signup()).token);
    const months = (await api.get("/dashboard/months")).body.data.months;
    expect(months[0]).toBe("2024-07");
    expect(months).toHaveLength(12);
    const o = (await api.get("/dashboard/overview?month=2024-07")).body.data;
    expect(o.totalVisitors).toBe(o.domesticVisitors + o.internationalVisitors);
    expect(o.topOverseasMarkets).toHaveLength(3);
    expect(o.change.totalVisitors).toBeNull(); // 2024-06 데이터 없음
  });
});
