import { Router } from "express";
import type { SortOrder } from "mongoose";
import { ROUTES, placeListQuery, placeSyncRequest, type PlaceSyncStatus } from "@totem/shared";
import { env } from "../../config/env";
import { HttpError, escapeRegex, notFound, ok, okPaged, parse } from "../../lib/http";
import { Place } from "../../db/models";
import { toPlace } from "../../db/serialize";
import { objectIdParam, requireAuth, requireRole } from "../../middlewares/auth";
import { fetchAreaItems, toPlaceRecord } from "./tourapi";

export const placesRouter = Router();
placesRouter.use(ROUTES.places.list, requireAuth);

const SORTS: Record<string, Record<string, SortOrder>> = {
  popularity: { popularity: -1, title: 1 },
  foreignPopularity: { foreignPopularity: -1, title: 1 },
  title: { title: 1 },
};

/** 코스메이커 "장소 선택" — 검색어·카테고리 버튼·정렬 버튼이 그대로 쿼리가 된다 */
placesRouter.get(ROUTES.places.list, async (req, res) => {
  const q = parse(placeListQuery, req.query);
  const filter: Record<string, unknown> = { isActive: true, areaCode: q.areaCode };
  if (q.category) filter.category = q.category;
  // 한글 부분일치는 text index 가 못 하므로 제목·주소 정규식 검색
  if (q.q) filter.$or = [{ title: { $regex: escapeRegex(q.q), $options: "i" } }, { addr1: { $regex: escapeRegex(q.q), $options: "i" } }];

  const [items, total] = await Promise.all([
    Place.find(filter).sort(SORTS[q.sort]).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
    Place.countDocuments(filter),
  ]);
  okPaged(res, items.map(toPlace), { page: q.page, limit: q.limit, total });
});


const HOUR_MS = 60 * 60 * 1000;
/** 같은 지역을 동시에 두 번 받지 않도록 (한 프로세스 안) */
const syncing = new Set<string>();

async function syncState(areaCode: string) {
  const [total, tourapiCount, last] = await Promise.all([
    Place.countDocuments({ areaCode, isActive: true }),
    Place.countDocuments({ areaCode, source: "tourapi", isActive: true }),
    Place.findOne({ areaCode, source: "tourapi" }).sort({ syncedAt: -1 }).select("syncedAt").lean(),
  ]);
  const lastSyncedAt = last?.syncedAt ?? null;
  const next = lastSyncedAt ? new Date(lastSyncedAt.getTime() + env.PLACE_SYNC_COOLDOWN_HOURS * HOUR_MS) : null;
  return { total, tourapiCount, lastSyncedAt, nextAvailableAt: next && next.getTime() > Date.now() ? next : null };
}

/** 설정 > 데이터 관리 — 동기화 상태 */
placesRouter.get(ROUTES.places.syncStatus, requireRole("owner", "admin"), async (req, res) => {
  const { areaCode } = parse(placeSyncRequest, req.query);
  const st = await syncState(areaCode);
  const status: PlaceSyncStatus = {
    areaCode,
    total: st.total,
    tourapiCount: st.tourapiCount,
    lastSyncedAt: st.lastSyncedAt ? st.lastSyncedAt.toISOString() : null,
    nextAvailableAt: st.nextAvailableAt ? st.nextAvailableAt.toISOString() : null,
    configured: !!env.TOURAPI_SERVICE_KEY,
  };
  ok(res, status);
});

/**
 * 관리자 — TourAPI 에서 지역 데이터를 받아 upsert. 인기 지표(popularity)는 보존한다.
 * 장소는 모든 조직의 공용 데이터라, 아무 조직 관리자나 반복 호출해 호출 한도를 소진하지 못하게 전역 간격을 둔다.
 */
placesRouter.post(ROUTES.places.sync, requireRole("owner", "admin"), async (req, res) => {
  const { areaCode } = parse(placeSyncRequest, req.body);
  const st = await syncState(areaCode);
  if (st.nextAvailableAt) {
    throw new HttpError(429, "RATE_LIMITED", `최근에 동기화했습니다. ${st.nextAvailableAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 이후에 다시 할 수 있습니다.`, {
      nextAvailableAt: st.nextAvailableAt.toISOString(),
    });
  }
  if (syncing.has(areaCode)) throw new HttpError(409, "CONFLICT", "이미 동기화 중입니다. 잠시 후 다시 확인해주세요.");
  syncing.add(areaCode);
  try {
    await runSync(areaCode, res);
  } finally {
    syncing.delete(areaCode);
  }
});

async function runSync(areaCode: string, res: Parameters<typeof ok>[0]) {
  const items = await fetchAreaItems(areaCode);
  const records = items.map(toPlaceRecord).filter((r): r is NonNullable<typeof r> => r !== null);
  const result = records.length
    ? await Place.bulkWrite(
        records.map((r) => ({
          updateOne: {
            filter: { source: r.source, contentId: r.contentId },
            update: { $set: r, $setOnInsert: { popularity: 0, foreignPopularity: 0 } },
            upsert: true,
          },
        })),
        { ordered: false },
      )
    : null;
  ok(res, { fetched: items.length, upserted: result?.upsertedCount ?? 0, modified: result?.modifiedCount ?? 0 });
}

/** 파라미터 경로는 맨 뒤에 — 앞에 두면 /places/sync-status 같은 고정 경로를 :id 로 가로챈다 */
placesRouter.get(ROUTES.places.detail(":id"), async (req, res) => {
  const place = await Place.findById(objectIdParam(req.params.id, "장소")).lean();
  if (!place) throw notFound("장소");
  ok(res, toPlace(place));
});
