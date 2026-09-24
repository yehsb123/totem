import { Router } from "express";
import type { SortOrder } from "mongoose";
import { ROUTES, placeListQuery, placeSyncRequest } from "@totem/shared";
import { escapeRegex, notFound, ok, okPaged, parse } from "../../lib/http";
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

placesRouter.get(ROUTES.places.detail(":id"), async (req, res) => {
  const place = await Place.findById(objectIdParam(req.params.id, "장소")).lean();
  if (!place) throw notFound("장소");
  ok(res, toPlace(place));
});

/** 관리자 — TourAPI 에서 지역 데이터를 받아 upsert. 인기 지표(popularity)는 보존한다 */
placesRouter.post(ROUTES.places.sync, requireRole("owner", "admin"), async (req, res) => {
  const { areaCode } = parse(placeSyncRequest, req.body);
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
});
