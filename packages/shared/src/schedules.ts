import { z } from "zod";
import { baseEntity, clockTime, isoDate, objectId } from "./common";
import { LABEL_COLORS } from "./enums";

/** 일정관리 라벨(구 EventType) — 이모지·색상·기본 장소/담당자 */
export const scheduleLabel = baseEntity.extend({
  name: z.string(),
  emoji: z.string(),
  color: z.enum(LABEL_COLORS),
  defaultPlace: z.string(),
  defaultManager: z.string(),
  /** 이 라벨을 쓰는 일정 수 (삭제 가능 여부 판단용) */
  eventCount: z.number().int(),
});
export type ScheduleLabel = z.infer<typeof scheduleLabel>;

export const upsertLabelRequest = z.object({
  name: z.string().trim().min(1, "라벨 이름을 입력해주세요.").max(30),
  emoji: z.string().trim().min(1).max(16),
  color: z.enum(LABEL_COLORS),
  defaultPlace: z.string().trim().max(100).default(""),
  defaultManager: z.string().trim().max(50).default(""),
});
export type UpsertLabelRequest = z.input<typeof upsertLabelRequest>;

export const scheduleItem = z.object({
  time: clockTime,
  place: z.string().trim().min(1).max(100),
});
export type ScheduleItem = z.infer<typeof scheduleItem>;

/** 캘린더 일정 */
export const scheduleEvent = baseEntity.extend({
  labelId: objectId.nullable(),
  tourId: objectId.nullable(),
  name: z.string(),
  startDate: isoDate,
  endDate: isoDate,
  manager: z.string(),
  items: z.array(scheduleItem),
  note: z.string(),
});
export type ScheduleEvent = z.infer<typeof scheduleEvent>;

const eventFields = z.object({
  labelId: objectId.nullable().default(null),
  tourId: objectId.nullable().default(null),
  name: z.string().trim().min(1, "일정 이름을 입력해주세요.").max(100),
  startDate: isoDate,
  endDate: isoDate,
  manager: z.string().trim().max(50).default(""),
  items: z.array(scheduleItem).max(50).default([]),
  note: z.string().max(1000).default(""),
});
const dateOrder = (e: { startDate?: string; endDate?: string }, ctx: z.RefinementCtx) => {
  if (e.startDate && e.endDate && e.startDate > e.endDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "종료일은 시작일과 같거나 이후여야 합니다." });
  }
};

export const createEventRequest = eventFields.superRefine(dateOrder);
export type CreateEventRequest = z.input<typeof createEventRequest>;

export const updateEventRequest = eventFields.partial().superRefine(dateOrder);
export type UpdateEventRequest = z.input<typeof updateEventRequest>;

/** GET /schedule/events — 달력 표시 범위와 검색어(이름·담당자·장소) */
export const eventListQuery = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  q: z.string().trim().max(50).optional(),
  labelId: objectId.optional(),
});
export type EventListQuery = z.input<typeof eventListQuery>;
