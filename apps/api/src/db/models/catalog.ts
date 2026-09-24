import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { PLACE_CATEGORIES } from "@totem/shared";

/**
 * 장소 캐시 — 한국관광공사 TourAPI 를 동기화한 공용 데이터(조직 무관).
 * 코스메이커 좌측 목록·지도 마커의 출처.
 */
const placeSchema = new Schema(
  {
    source: { type: String, enum: ["tourapi", "manual"], default: "tourapi" },
    contentId: { type: String, required: true },
    contentTypeId: { type: String, default: null },
    category: { type: String, enum: PLACE_CATEGORIES, required: true, index: true },
    title: { type: String, required: true, trim: true },
    addr1: { type: String, default: null },
    addr2: { type: String, default: null },
    zipcode: { type: String, default: null },
    tel: { type: String, default: null },
    areaCode: { type: String, default: null },
    sigunguCode: { type: String, default: null },
    cat1: { type: String, default: null },
    cat2: { type: String, default: null },
    cat3: { type: String, default: null },
    mapX: { type: Number, required: true },
    mapY: { type: Number, required: true },
    imageUrl: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },
    /** 정렬용 지표 — 코스에 담긴 횟수 등으로 갱신 (TourAPI 는 인기 지표를 주지 않음) */
    popularity: { type: Number, default: 0 },
    foreignPopularity: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    syncedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
placeSchema.index({ source: 1, contentId: 1 }, { unique: true });
placeSchema.index({ areaCode: 1, category: 1, popularity: -1 });
placeSchema.index({ title: "text", addr1: "text" });
export const Place = model("Place", placeSchema, "places");
export type PlaceDoc = InferSchemaType<typeof placeSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

/**
 * 지역 관광 통계 — 대시보드 6개 탭. 지역·월 1건. 단위는 원본(한국관광데이터랩) 기준.
 */
const nameValue = new Schema({ name: String, value: Number }, { _id: false });
const categoryAmount = new Schema({ category: String, amount: Number }, { _id: false });

const tourismStatSchema = new Schema(
  {
    region: { type: String, required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    domesticVisitors: { type: Number, default: 0 },
    genderAge: { type: [new Schema({ ageGroup: String, maleRatio: Number, femaleRatio: Number }, { _id: false })], default: [] },
    internationalVisitors: { type: Number, default: 0 },
    countryRatios: { type: [new Schema({ country: String, ratio: Number }, { _id: false })], default: [] },
    snsMentions: { type: Number, default: 0 },
    companionTypes: { type: [nameValue], default: [] },
    travelTypes: { type: [nameValue], default: [] },
    domesticSpending: { total: { type: Number, default: 0 }, byCategory: { type: [categoryAmount], default: [] } },
    internationalSpending: { total: { type: Number, default: 0 }, byCategory: { type: [categoryAmount], default: [] } },
    source: { type: String, default: "한국관광데이터랩" },
  },
  { timestamps: true },
);
tourismStatSchema.index({ region: 1, month: 1 }, { unique: true });
export const TourismStat = model("TourismStat", tourismStatSchema, "tourism_stats");
export type TourismStatDoc = InferSchemaType<typeof tourismStatSchema> & { _id: Types.ObjectId };
