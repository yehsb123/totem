import { Router } from "express";
import type { Types } from "mongoose";
import { ROUTES, createReviewRequest, importReviewsRequest, reviewListQuery, type ReviewSummary } from "@totem/shared";
import { sha256 } from "../../lib/crypto";
import { noContent, notFound, ok, okPaged, parse } from "../../lib/http";
import { Review, ReviewImport, Tour } from "../../db/models";
import { toReview } from "../../db/serialize";
import { authOf, objectIdParam, requireAuth } from "../../middlewares/auth";
import { downloadCsv, mapRows, parseCsv } from "./csv";

export const reviewsRouter = Router();
reviewsRouter.use(["/tours/:tourId/reviews", "/reviews"], requireAuth);

async function findTour(organizationId: Types.ObjectId, tourId: string | string[] | undefined) {
  const tour = await Tour.findOne({ _id: objectIdParam(tourId, "투어"), organizationId, deletedAt: null }).select("_id").lean();
  if (!tour) throw notFound("투어");
  return tour._id;
}

/** 투어 목록의 평균·개수 집계를 리뷰 변경과 함께 갱신 */
const bumpStats = (tourId: Types.ObjectId, ratingDelta: number, countDelta: number) =>
  Tour.updateOne({ _id: tourId }, { $inc: { "reviewStats.ratingSum": ratingDelta, "reviewStats.count": countDelta } });

reviewsRouter.get(ROUTES.tours.reviews(":tourId"), async (req, res) => {
  const { organizationId } = authOf(req);
  const tourId = await findTour(organizationId, req.params.tourId);
  const q = parse(reviewListQuery, req.query);
  const filter = { organizationId, tourId };
  const [items, total] = await Promise.all([
    Review.find(filter).sort({ submittedAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
    Review.countDocuments(filter),
  ]);
  okPaged(res, items.map(toReview), { page: q.page, limit: q.limit, total });
});

/** 전체 리뷰 기준 항목별 평균 (소수 1자리, 값이 하나도 없으면 null) */
reviewsRouter.get(ROUTES.tours.reviewSummary(":tourId"), async (req, res) => {
  const { organizationId } = authOf(req);
  const tourId = await findTour(organizationId, req.params.tourId);
  const [row] = await Review.aggregate<Record<string, number | null>>([
    { $match: { organizationId, tourId } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        total: { $avg: "$totalRating" },
        restaurant: { $avg: "$restaurantRating" },
        accommodation: { $avg: "$accommodationRating" },
        attraction: { $avg: "$attractionRating" },
        guide: { $avg: "$guideRating" },
      },
    },
  ]);
  const r1 = (v: number | null | undefined) => (v === null || v === undefined ? null : Math.round(v * 10) / 10);
  const summary: ReviewSummary = {
    count: row?.count ?? 0,
    total: r1(row?.total),
    restaurant: r1(row?.restaurant),
    accommodation: r1(row?.accommodation),
    attraction: r1(row?.attraction),
    guide: r1(row?.guide),
  };
  ok(res, summary);
});

reviewsRouter.post(ROUTES.tours.reviews(":tourId"), async (req, res) => {
  const { organizationId } = authOf(req);
  const tourId = await findTour(organizationId, req.params.tourId);
  const body = parse(createReviewRequest, req.body);
  const review = await Review.create({
    ...body,
    organizationId,
    tourId,
    source: "manual",
    submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
  });
  await bumpStats(tourId, body.totalRating, 1);
  ok(res, toReview(review.toObject()), 201);
});

/** "CSV로 리뷰 저장" — 같은 CSV 를 다시 가져와도 행 지문으로 중복을 건너뛴다 */
reviewsRouter.post(ROUTES.tours.reviewImport(":tourId"), async (req, res) => {
  const { organizationId, userId } = authOf(req);
  const tourId = await findTour(organizationId, req.params.tourId);
  const { csvUrl } = parse(importReviewsRequest, req.body);

  const { parsed, errors } = mapRows(parseCsv(await downloadCsv(csvUrl)));
  const totalRows = parsed.length + errors.length;
  const batch = await ReviewImport.create({ organizationId, tourId, csvUrl, createdBy: userId });

  let imported = 0;
  let ratingSum = 0;
  for (const { row, review } of parsed) {
    const fingerprint = sha256(`${tourId}|${JSON.stringify(review)}`);
    try {
      await Review.create({ ...review, organizationId, tourId, source: "csv", importBatchId: batch._id, fingerprint, submittedAt: new Date(review.submittedAt) });
      imported++;
      ratingSum += review.totalRating;
    } catch (e) {
      errors.push({ row, message: (e as { code?: number }).code === 11000 ? "이미 가져온 리뷰입니다." : "저장 실패" });
    }
  }
  if (imported) await bumpStats(tourId, ratingSum, imported);

  const result = {
    batchId: String(batch._id),
    totalRows,
    imported,
    skipped: totalRows - imported,
    errors: errors.sort((a, b) => a.row - b.row).slice(0, 100),
  };
  await ReviewImport.updateOne({ _id: batch._id }, { $set: { totalRows: result.totalRows, imported, skipped: result.skipped, errors: result.errors } });
  ok(res, result, 201);
});

reviewsRouter.delete(ROUTES.reviews.detail(":id"), async (req, res) => {
  const { organizationId } = authOf(req);
  const review = await Review.findOneAndDelete({ _id: objectIdParam(req.params.id, "리뷰"), organizationId }).lean();
  if (!review) throw notFound("리뷰");
  await bumpStats(review.tourId, -review.totalRating, -1);
  noContent(res);
});
