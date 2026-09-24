import { z } from "zod";
import { baseEntity, isoDate, objectId, paginationQuery } from "./common";
import { NATIONS, TOUR_STATUSES } from "./enums";

/**
 * 투어 = 코스를 실제로 운영하는 회차.
 * 투어관리 표(투어명·타입·기간·상태·담당자·예상/예약/잔여 인원)와 리뷰관리 목록의 기준 엔티티.
 */
export const tour = baseEntity.extend({
  courseId: objectId.nullable(),
  title: z.string(),
  type: z.string(),
  nation: z.enum(NATIONS),
  startDate: isoDate,
  endDate: isoDate,
  status: z.enum(TOUR_STATUSES),
  managerName: z.string(),
  /** 예상 인원 */
  capacity: z.number().int(),
  /** 예약 인원 */
  bookedSeats: z.number().int(),
  /** 잔여 좌석 = capacity - bookedSeats (서버 계산) */
  remainingSeats: z.number().int(),
  note: z.string(),
  reviewStats: z.object({
    averageRating: z.number().nullable(),
    reviewCount: z.number().int(),
  }),
});
export type Tour = z.infer<typeof tour>;

const tourFields = z.object({
  courseId: objectId.nullable().default(null),
  title: z.string().trim().min(1, "투어명을 입력해주세요.").max(100),
  type: z.string().trim().min(1).max(30).default("일반"),
  nation: z.enum(NATIONS).default("KR"),
  startDate: isoDate,
  endDate: isoDate,
  status: z.enum(TOUR_STATUSES).default("planned"),
  managerName: z.string().trim().max(50).default(""),
  capacity: z.number().int().min(0).max(10000).default(0),
  bookedSeats: z.number().int().min(0).max(10000).default(0),
  note: z.string().max(1000).default(""),
});

const seatsAndDates = (t: { startDate?: string; endDate?: string; capacity?: number; bookedSeats?: number }, ctx: z.RefinementCtx) => {
  if (t.startDate && t.endDate && t.startDate > t.endDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "종료일은 시작일과 같거나 이후여야 합니다." });
  }
  if (t.capacity !== undefined && t.bookedSeats !== undefined && t.bookedSeats > t.capacity) {
    ctx.addIssue({ code: "custom", path: ["bookedSeats"], message: "예약 인원이 예상 인원을 초과할 수 없습니다." });
  }
};

/** POST /tours */
export const createTourRequest = tourFields.superRefine(seatsAndDates);
export type CreateTourRequest = z.input<typeof createTourRequest>;

/** PATCH /tours/:id — 표에서 좌석 수·상태를 인라인 수정 (부분 수정; 서버가 기존값과 합쳐 다시 검증) */
export const updateTourRequest = tourFields.partial().superRefine(seatsAndDates);
export type UpdateTourRequest = z.input<typeof updateTourRequest>;

/** GET /tours — 투어명 검색, 날짜(해당일에 진행 중), 타입, 상태 필터 */
export const tourListQuery = paginationQuery.extend({
  q: z.string().trim().max(50).optional(),
  date: isoDate.optional(),
  type: z.string().trim().max(30).optional(),
  status: z.enum(TOUR_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type TourListQuery = z.input<typeof tourListQuery>;
