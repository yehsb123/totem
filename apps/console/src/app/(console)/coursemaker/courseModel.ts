import { DEFAULT_TIME_SLOTS, HOTEL_SLOT_INDEX, enumerateDates, type Course, type CourseDay, type CoursePlace, type LocalSearchItem, type Place } from "@totem/shared";

/** 편집 중인 하루: 시간대 칸마다 장소 또는 빈칸(null) */
export interface EditorDay {
  date: string;
  slots: (CoursePlace | null)[];
}

export const TIME_SLOTS: string[] = [...DEFAULT_TIME_SLOTS];
export { HOTEL_SLOT_INDEX };

export const DND = {
  /** 왼쪽 목록에서 끌어온 장소 */
  PLACE: "place",
  /** 일정 안에서 옮기는 장소 */
  SLOT: "slot",
} as const;

export type DragPlace = { kind: typeof DND.PLACE; place: CoursePlace };
export type DragSlot = { kind: typeof DND.SLOT; fromIndex: number };

export function snapshot(p: Place): CoursePlace {
  return {
    placeId: p.id,
    contentId: p.contentId,
    title: p.title,
    addr1: p.addr1,
    category: p.category,
    mapX: p.mapX,
    mapY: p.mapY,
    imageUrl: p.thumbnailUrl ?? p.imageUrl,
  };
}

/** 카카오 로컬 검색 결과 → 코스 장소. 장소 캐시에 없는 곳이라 placeId 는 없고 contentId 에 출처를 남긴다 */
export function snapshotFromKakao(k: LocalSearchItem): CoursePlace {
  return {
    placeId: null,
    contentId: `kakao:${k.id}`,
    title: k.name,
    addr1: k.roadAddress ?? k.address,
    category: k.category,
    mapX: k.mapX,
    mapY: k.mapY,
    imageUrl: null,
  };
}

/** 그날 이동 순서 — 시간대 칸 순서대로, 숙소가 있으면 하루의 끝(숙소로 복귀)으로 둔다 */
export function dayRoutePoints(day: EditorDay): { x: number; y: number; name: string }[] {
  const stops = day.slots.flatMap((p, i) => (p && i !== HOTEL_SLOT_INDEX ? [p] : []));
  const hotel = day.slots[HOTEL_SLOT_INDEX];
  return [...stops, ...(hotel ? [hotel] : [])].map((p) => ({ x: p.mapX, y: p.mapY, name: p.title }));
}

const emptySlots = (n: number) => Array<CoursePlace | null>(n).fill(null);

/** 기간이 바뀌면 날짜별로 기존 편집 내용을 보존하며 일차 배열을 다시 만든다 */
export function resizeDays(start: string, end: string, prev: EditorDay[], slotCount = TIME_SLOTS.length): EditorDay[] {
  if (!start || !end || start > end) return [];
  const byDate = new Map(prev.map((d) => [d.date, d]));
  return enumerateDates(start, end).map((date) => byDate.get(date) ?? { date, slots: emptySlots(slotCount) });
}

export function toRequestDays(days: EditorDay[]): CourseDay[] {
  return days.map((d, i) => ({
    dayNumber: i + 1,
    date: d.date,
    slots: d.slots.flatMap((place, slotIndex) => (place ? [{ slotIndex, place, memo: null }] : [])),
  }));
}

export function fromCourse(c: Course): EditorDay[] {
  return c.days.map((d) => {
    const slots = emptySlots(c.timeSlots.length);
    d.slots.forEach((s) => {
      if (s.slotIndex < slots.length) slots[s.slotIndex] = s.place;
    });
    return { date: d.date, slots };
  });
}

/** 칸에 놓을 수 있는지 — 서버 규칙(validateCourseRules)과 같은 규칙을 화면에서 먼저 막는다 */
export function placementError(place: CoursePlace, slotIndex: number): string | null {
  const isHotel = place.category === "hotel";
  if (slotIndex === HOTEL_SLOT_INDEX && !isHotel) return "숙소 칸에는 숙소만 넣을 수 있습니다.";
  if (slotIndex !== HOTEL_SLOT_INDEX && isHotel) return "숙소는 맨 위 숙소 칸에만 넣을 수 있습니다.";
  return null;
}
