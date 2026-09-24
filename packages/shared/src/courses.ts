import { z } from "zod";
import { baseEntity, isoDate, objectId, paginationQuery } from "./common";
import { NATIONS, PLACE_CATEGORIES } from "./enums";

/**
 * 코스메이커 시간대. index 0 은 숙소 전용 슬롯이다.
 * (구 코드는 10:00~11:00, 20:00~22:00 이 빠져 있었다 → 연속 시간대로 교정)
 */
export const HOTEL_SLOT_INDEX = 0;
export const DEFAULT_TIME_SLOTS = [
  "(숙소)",
  "07:00~08:00",
  "08:00~09:00",
  "09:00~10:00",
  "10:00~11:00",
  "11:00~12:00",
  "12:00~13:00",
  "13:00~14:00",
  "14:00~15:00",
  "15:00~16:00",
  "16:00~17:00",
  "17:00~18:00",
  "18:00~19:00",
  "19:00~20:00",
  "20:00~21:00",
  "21:00~22:00",
] as const;

export const MAX_COURSE_DAYS = 31;

const timeSlotLabel = z
  .string()
  .regex(/^(\(숙소\)|([01]\d|2[0-3]):[0-5]\d~([01]\d|2[0-4]):[0-5]\d)$/, "시간대 형식이 올바르지 않습니다.");

/** 코스에 담긴 장소 스냅샷 — 장소 캐시가 바뀌어도 저장된 코스는 그대로 보이도록 복사해 둔다 */
export const coursePlace = z.object({
  placeId: objectId.nullable(),
  contentId: z.string().nullable(),
  title: z.string().min(1).max(200),
  addr1: z.string().nullable(),
  category: z.enum(PLACE_CATEGORIES),
  mapX: z.number(),
  mapY: z.number(),
  imageUrl: z.string().nullable(),
});
export type CoursePlace = z.infer<typeof coursePlace>;

export const courseSlot = z.object({
  slotIndex: z.number().int().min(0),
  place: coursePlace,
  memo: z.string().max(200).nullable().default(null),
});
export type CourseSlot = z.infer<typeof courseSlot>;

export const courseDay = z.object({
  dayNumber: z.number().int().min(1),
  date: isoDate,
  /** 비어 있는 슬롯은 저장하지 않는다 */
  slots: z.array(courseSlot),
});
export type CourseDay = z.infer<typeof courseDay>;

const courseFields = z.object({
  title: z.string().trim().min(1, "코스 이름을 입력해주세요.").max(100),
  pickupLocation: z.string().trim().max(200).default(""),
  startDate: isoDate,
  endDate: isoDate,
  nation: z.enum(NATIONS).default("KR"),
  note: z.string().max(1000).default(""),
  timeSlots: z.array(timeSlotLabel).min(2).default([...DEFAULT_TIME_SLOTS]),
  days: z.array(courseDay),
});
type CourseFields = z.infer<typeof courseFields>;

export function enumerateDates(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cur <= last && out.length <= 366) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/**
 * 코스 규칙 (서버 검증·화면 사전검증 공통):
 * 1) 시작일 ≤ 종료일, 최대 MAX_COURSE_DAYS 일
 * 2) days 는 기간의 모든 날짜를 1일차부터 빠짐없이 순서대로 가진다
 * 3) slotIndex 는 timeSlots 범위 안, 하루 안에서 중복 불가
 * 4) 숙소(hotel)는 HOTEL_SLOT_INDEX 에만, HOTEL_SLOT_INDEX 에는 숙소만
 * 5) 장소가 하나 이상 있어야 저장 가능
 */
export function validateCourseRules(c: CourseFields, ctx: z.RefinementCtx) {
  if (c.startDate > c.endDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "종료일은 시작일과 같거나 이후여야 합니다." });
    return;
  }
  const expected = enumerateDates(c.startDate, c.endDate);
  if (expected.length > MAX_COURSE_DAYS) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: `코스 기간은 최대 ${MAX_COURSE_DAYS}일입니다.` });
    return;
  }
  if (c.days.length !== expected.length) {
    ctx.addIssue({
      code: "custom",
      path: ["days"],
      message: `기간(${expected.length}일)과 일차 수(${c.days.length})가 다릅니다.`,
    });
    return;
  }
  let placeCount = 0;
  c.days.forEach((day, di) => {
    if (day.dayNumber !== di + 1 || day.date !== expected[di]) {
      ctx.addIssue({ code: "custom", path: ["days", di], message: `${di + 1}일차 날짜가 기간과 맞지 않습니다.` });
    }
    const seen = new Set<number>();
    day.slots.forEach((slot, si) => {
      const path = ["days", di, "slots", si];
      if (slot.slotIndex >= c.timeSlots.length) {
        ctx.addIssue({ code: "custom", path, message: "존재하지 않는 시간대입니다." });
      }
      if (seen.has(slot.slotIndex)) {
        ctx.addIssue({ code: "custom", path, message: "같은 시간대에 장소가 중복되었습니다." });
      }
      seen.add(slot.slotIndex);
      const isHotel = slot.place.category === "hotel";
      if (isHotel !== (slot.slotIndex === HOTEL_SLOT_INDEX)) {
        ctx.addIssue({ code: "custom", path, message: "숙소는 숙소 전용 시간대에만, 숙소 시간대에는 숙소만 배치할 수 있습니다." });
      }
      placeCount++;
    });
  });
  if (placeCount === 0) {
    ctx.addIssue({ code: "custom", path: ["days"], message: "최소한 하나의 장소를 스케줄에 추가해주세요." });
  }
}

/** 코스 저장과 함께 투어관리에 올릴 운영 정보 (생략하면 투어를 만들지 않는다) */
export const courseTourOptions = z.object({
  type: z.string().trim().max(30).default("일반"),
  managerName: z.string().trim().max(50).default(""),
  capacity: z.number().int().min(0).max(10000).default(0),
});

/** POST /courses — 코스메이커 "코스 생성 완료" */
export const createCourseRequest = courseFields
  .extend({ tour: courseTourOptions.optional() })
  .superRefine(validateCourseRules);
export type CreateCourseRequest = z.input<typeof createCourseRequest>;

/** PUT /courses/:id — 코스 전체 교체 저장 (드래그 편집 결과를 통째로 보낸다) */
export const updateCourseRequest = courseFields.superRefine(validateCourseRules);
export type UpdateCourseRequest = z.input<typeof updateCourseRequest>;

export const course = baseEntity.extend({
  title: z.string(),
  pickupLocation: z.string(),
  startDate: isoDate,
  endDate: isoDate,
  nation: z.enum(NATIONS),
  note: z.string(),
  timeSlots: z.array(z.string()),
  days: z.array(courseDay),
  createdBy: objectId,
  /** 이 코스로 만들어진 투어 id 목록 */
  tourIds: z.array(objectId),
});
export type Course = z.infer<typeof course>;

export type CourseSummary = Pick<
  Course,
  "id" | "title" | "startDate" | "endDate" | "pickupLocation" | "createdAt" | "updatedAt"
> & {
  placeCount: number;
  /** 이 코스로 만든 (삭제되지 않은) 투어 수 — 0 이어야 코스를 삭제할 수 있다 */
  tourCount: number;
};

export const courseListQuery = paginationQuery.extend({
  q: z.string().trim().max(50).optional(),
});
export type CourseListQuery = z.input<typeof courseListQuery>;
