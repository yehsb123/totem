import { z } from "zod";
import { baseEntity, paginationQuery } from "./common";
import { PLACE_CATEGORIES, PLACE_SORTS, type PlaceCategory } from "./enums";

/**
 * 장소 = 한국관광공사 TourAPI 데이터를 서버가 동기화해 둔 캐시.
 * 코스메이커 좌측 "장소 선택" 목록과 지도 마커의 데이터 출처.
 */
export const place = baseEntity.extend({
  contentId: z.string(),
  contentTypeId: z.string().nullable(),
  category: z.enum(PLACE_CATEGORIES),
  title: z.string(),
  addr1: z.string().nullable(),
  addr2: z.string().nullable(),
  zipcode: z.string().nullable(),
  tel: z.string().nullable(),
  areaCode: z.string().nullable(),
  sigunguCode: z.string().nullable(),
  /** 경도 (Kakao LatLng 의 lng) */
  mapX: z.number(),
  /** 위도 (Kakao LatLng 의 lat) */
  mapY: z.number(),
  imageUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  popularity: z.number(),
  foreignPopularity: z.number(),
});
export type Place = z.infer<typeof place>;

/** GET /places — 검색어·카테고리·정렬 (코스메이커 필터 버튼과 1:1) */
export const placeListQuery = paginationQuery.extend({
  q: z.string().trim().max(50).optional(),
  category: z.enum(PLACE_CATEGORIES).optional(),
  sort: z.enum(PLACE_SORTS).default("popularity"),
  areaCode: z.string().default("39"), // 39 = 제주
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type PlaceListQuery = z.infer<typeof placeListQuery>;

/** POST /places/sync (관리자) — TourAPI 에서 지역 데이터를 다시 받아 캐시 갱신 */
export const placeSyncRequest = z.object({
  areaCode: z.string().default("39"),
});
export type PlaceSyncRequest = z.input<typeof placeSyncRequest>;
export interface PlaceSyncResult {
  fetched: number;
  upserted: number;
  modified: number;
}

/**
 * 카카오 업종 그룹 코드 → 코스메이커 분류.
 * FD6 음식점 · CE7 카페 · AD5 숙박 · AT4 관광명소 · CT1 문화시설 · 그 외(편의점·주차장 등) etc
 */
export function kakaoCategory(groupCode: string | null | undefined): PlaceCategory {
  switch (groupCode) {
    case "FD6":
      return "restaurant";
    case "CE7":
      return "cafe";
    case "AD5":
      return "hotel";
    case "AT4":
    case "CT1":
      return "attraction";
    default:
      return "etc";
  }
}

/** GET /maps/local-search — 카카오 로컬 키워드 검색 프록시 (REST 키는 서버에만 둔다) */
export const localSearchQuery = z.object({
  query: z.string().trim().min(1).max(100),
  x: z.coerce.number().optional(),
  y: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).max(45).default(1),
});
export type LocalSearchQuery = z.input<typeof localSearchQuery>;
export interface LocalSearchItem {
  id: string;
  name: string;
  address: string;
  roadAddress: string | null;
  phone: string | null;
  categoryName: string;
  /** 카카오 업종 그룹 코드를 코스메이커 분류로 바꾼 값 (숙소 칸 규칙에 쓰인다) */
  category: PlaceCategory;
  mapX: number;
  mapY: number;
  url: string;
}

const point = z.object({ x: z.number(), y: z.number(), name: z.string().optional() });

/** POST /maps/directions — 카카오모빌리티 다중 경유지 길찾기 프록시 */
export const directionsRequest = z.object({
  origin: point,
  destination: point,
  waypoints: z.array(point).max(30).default([]),
  priority: z.enum(["RECOMMEND", "TIME", "DISTANCE"]).default("RECOMMEND"),
});
export type DirectionsRequest = z.input<typeof directionsRequest>;
export interface DirectionsResult {
  /** 미터 */
  distance: number;
  /** 초 */
  duration: number;
  taxiFare: number;
  tollFare: number;
  /** 지도 폴리라인용 [x, y] 좌표 */
  path: [number, number][];
}
