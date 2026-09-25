import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { LABEL_COLORS, NATIONS, PLACE_CATEGORIES, REVIEW_SOURCES, TOUR_STATUSES } from "@totem/shared";

const orgRef = { type: Schema.Types.ObjectId, ref: "Organization", required: true } as const;
const isoDate = { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ } as const;

/* ───────────── 코스 (코스메이커) ───────────── */

const coursePlaceSchema = new Schema(
  {
    placeId: { type: Schema.Types.ObjectId, ref: "Place", default: null },
    contentId: { type: String, default: null },
    title: { type: String, required: true },
    addr1: { type: String, default: null },
    category: { type: String, enum: PLACE_CATEGORIES, required: true },
    mapX: { type: Number, required: true },
    mapY: { type: Number, required: true },
    imageUrl: { type: String, default: null },
  },
  { _id: false },
);

const courseSchema = new Schema(
  {
    organizationId: orgRef,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    pickupLocation: { type: String, default: "" },
    startDate: isoDate,
    endDate: isoDate,
    nation: { type: String, enum: NATIONS, default: "KR" },
    note: { type: String, default: "" },
    timeSlots: { type: [String], required: true },
    days: {
      type: [
        new Schema(
          {
            dayNumber: { type: Number, required: true },
            date: isoDate,
            slots: {
              type: [
                new Schema(
                  { slotIndex: { type: Number, required: true }, place: coursePlaceSchema, memo: { type: String, default: null } },
                  { _id: false },
                ),
              ],
              default: [],
            },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
courseSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
export const Course = model("Course", courseSchema, "courses");
export type CourseDoc = InferSchemaType<typeof courseSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

/* ───────────── 투어 (투어관리 · 리뷰관리 기준) ───────────── */

const tourSchema = new Schema(
  {
    organizationId: orgRef,
    courseId: { type: Schema.Types.ObjectId, ref: "Course", default: null },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, default: "일반", trim: true },
    nation: { type: String, enum: NATIONS, default: "KR" },
    startDate: isoDate,
    endDate: isoDate,
    status: { type: String, enum: TOUR_STATUSES, default: "planned" },
    managerName: { type: String, default: "" },
    capacity: { type: Number, default: 0, min: 0 },
    bookedSeats: { type: Number, default: 0, min: 0 },
    note: { type: String, default: "" },
    /** 리뷰 등록/삭제 시 서버가 갱신하는 집계 (목록에서 N+1 조회 제거) */
    reviewStats: {
      ratingSum: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
tourSchema.index({ organizationId: 1, deletedAt: 1, startDate: -1 });
tourSchema.index({ organizationId: 1, courseId: 1 });
export const Tour = model("Tour", tourSchema, "tours");
export type TourDoc = InferSchemaType<typeof tourSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

/* ───────────── 리뷰 (리뷰관리) ───────────── */

const rating = { type: Number, min: 1, max: 5 } as const;

const reviewSchema = new Schema(
  {
    organizationId: orgRef,
    tourId: { type: Schema.Types.ObjectId, ref: "Tour", required: true },
    reviewerName: { type: String, default: null },
    totalRating: { ...rating, required: true },
    restaurantRating: { ...rating, default: null },
    accommodationRating: { ...rating, default: null },
    attractionRating: { ...rating, default: null },
    guideRating: { ...rating, default: null },
    comment: { type: String, default: null },
    source: { type: String, enum: REVIEW_SOURCES, default: "manual" },
    importBatchId: { type: Schema.Types.ObjectId, ref: "ReviewImport", default: null },
    /** 같은 CSV 를 두 번 가져와도 중복 저장하지 않기 위한 행 지문 */
    fingerprint: { type: String, default: null },
    submittedAt: { type: Date, required: true },
  },
  { timestamps: true },
);
reviewSchema.index({ organizationId: 1, tourId: 1, submittedAt: -1 });
reviewSchema.index({ tourId: 1, fingerprint: 1 }, { unique: true, partialFilterExpression: { fingerprint: { $type: "string" } } });
export const Review = model("Review", reviewSchema, "reviews");
export type ReviewDoc = InferSchemaType<typeof reviewSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

/** CSV 가져오기 이력 (몇 건 성공/실패했는지 추적) */
const reviewImportSchema = new Schema(
  {
    organizationId: orgRef,
    tourId: { type: Schema.Types.ObjectId, ref: "Tour", required: true },
    csvUrl: { type: String, required: true },
    totalRows: { type: Number, default: 0 },
    imported: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    errors: { type: [new Schema({ row: Number, message: String }, { _id: false })], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, suppressReservedKeysWarning: true },
);
reviewImportSchema.index({ organizationId: 1, tourId: 1, createdAt: -1 }); // 조직별 정리(purge)·투어별 가져오기 이력
export const ReviewImport = model("ReviewImport", reviewImportSchema, "review_imports");

/* ───────────── 일정관리 ───────────── */

const scheduleLabelSchema = new Schema(
  {
    organizationId: orgRef,
    name: { type: String, required: true, trim: true, maxlength: 30 },
    emoji: { type: String, required: true },
    color: { type: String, enum: LABEL_COLORS, required: true },
    defaultPlace: { type: String, default: "" },
    defaultManager: { type: String, default: "" },
  },
  { timestamps: true },
);
scheduleLabelSchema.index({ organizationId: 1, name: 1 }, { unique: true });
export const ScheduleLabel = model("ScheduleLabel", scheduleLabelSchema, "schedule_labels");
export type ScheduleLabelDoc = InferSchemaType<typeof scheduleLabelSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

const scheduleEventSchema = new Schema(
  {
    organizationId: orgRef,
    labelId: { type: Schema.Types.ObjectId, ref: "ScheduleLabel", default: null },
    tourId: { type: Schema.Types.ObjectId, ref: "Tour", default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    startDate: isoDate,
    endDate: isoDate,
    manager: { type: String, default: "" },
    items: { type: [new Schema({ time: String, place: String }, { _id: false })], default: [] },
    note: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);
// 달력 범위 조회: startDate ≤ to AND endDate ≥ from
scheduleEventSchema.index({ organizationId: 1, startDate: 1, endDate: 1 });
scheduleEventSchema.index({ organizationId: 1, labelId: 1 });
scheduleEventSchema.index({ organizationId: 1, tourId: 1 }); // 투어 수정·삭제 시 연결된 일정 맞추기
export const ScheduleEvent = model("ScheduleEvent", scheduleEventSchema, "schedule_events");
export type ScheduleEventDoc = InferSchemaType<typeof scheduleEventSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
