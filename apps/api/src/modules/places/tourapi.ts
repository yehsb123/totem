import type { PlaceCategory } from "@totem/shared";
import { env } from "../../config/env";
import { notConfigured, upstream } from "../../lib/http";

/** TourAPI areaBasedList2 응답 항목 (값은 모두 문자열로 온다) */
export interface TourApiItem {
  contentid: string;
  contenttypeid?: string;
  title: string;
  addr1?: string;
  addr2?: string;
  zipcode?: string;
  tel?: string;
  areacode?: string;
  sigungucode?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  mapx?: string;
  mapy?: string;
  firstimage?: string;
  firstimage2?: string;
}

/** 관광타입(contentTypeId) → 코스메이커 카테고리. 카페는 소분류 코드로 구분한다 */
const CAFE_CAT3 = "A05020900";
export function categorize(item: Pick<TourApiItem, "contenttypeid" | "cat3">): PlaceCategory {
  switch (item.contenttypeid) {
    case "39":
      return item.cat3 === CAFE_CAT3 ? "cafe" : "restaurant";
    case "32":
      return "hotel";
    case "12": // 관광지
    case "14": // 문화시설
    case "28": // 레포츠
      return "attraction";
    default: // 15 축제, 25 여행코스, 38 쇼핑
      return "etc";
  }
}

const blankToNull = (v?: string) => (v && v.trim() ? v.trim() : null);

export function toPlaceRecord(item: TourApiItem) {
  const mapX = Number(item.mapx);
  const mapY = Number(item.mapy);
  if (!item.contentid || !item.title || !Number.isFinite(mapX) || !Number.isFinite(mapY) || mapX === 0 || mapY === 0) return null;
  return {
    source: "tourapi" as const,
    contentId: item.contentid,
    contentTypeId: blankToNull(item.contenttypeid),
    category: categorize(item),
    title: item.title.trim(),
    addr1: blankToNull(item.addr1),
    addr2: blankToNull(item.addr2),
    zipcode: blankToNull(item.zipcode),
    tel: blankToNull(item.tel),
    areaCode: blankToNull(item.areacode),
    sigunguCode: blankToNull(item.sigungucode),
    cat1: blankToNull(item.cat1),
    cat2: blankToNull(item.cat2),
    cat3: blankToNull(item.cat3),
    mapX,
    mapY,
    imageUrl: blankToNull(item.firstimage),
    thumbnailUrl: blankToNull(item.firstimage2),
    isActive: true,
    syncedAt: new Date(),
  };
}

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

/** 지역 전체 관광정보를 페이지를 넘겨 가며 모두 받는다 */
export async function fetchAreaItems(areaCode: string): Promise<TourApiItem[]> {
  if (!env.TOURAPI_SERVICE_KEY) throw notConfigured("TourAPI 서비스키(TOURAPI_SERVICE_KEY)");
  const all: TourApiItem[] = [];
  for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo++) {
    const params = new URLSearchParams({
      serviceKey: env.TOURAPI_SERVICE_KEY,
      MobileOS: "WEB",
      MobileApp: "Totem",
      _type: "json",
      numOfRows: String(PAGE_SIZE),
      pageNo: String(pageNo),
      arrange: "A",
      areaCode,
    });
    const res = await fetch(`${env.TOURAPI_BASE_URL}/areaBasedList2?${params}`, { signal: AbortSignal.timeout(20_000) }).catch(() => {
      throw upstream("TourAPI 서버에 연결할 수 없습니다.");
    });
    const json = (await res.json().catch(() => null)) as {
      response?: { header?: { resultCode?: string; resultMsg?: string }; body?: { totalCount?: number; items?: { item?: TourApiItem | TourApiItem[] } | "" } };
    } | null;
    const header = json?.response?.header;
    if (!res.ok || header?.resultCode !== "0000") {
      throw upstream(`TourAPI 오류: ${header?.resultMsg ?? res.status}`);
    }
    const body = json!.response!.body!;
    const raw = typeof body.items === "object" ? body.items.item : undefined;
    const items = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
    all.push(...items);
    if (all.length >= (body.totalCount ?? 0) || items.length < PAGE_SIZE) break;
  }
  return all;
}
