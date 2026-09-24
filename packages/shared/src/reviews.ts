import { z } from "zod";
import { baseEntity, isoDateTime, objectId, paginationQuery } from "./common";
import { REVIEW_SOURCES } from "./enums";

const rating = z.number().int().min(1).max(5);

/** 리뷰관리 하단 상세 표 (총점·식당·숙소·관광지·가이드·코멘트) */
export const review = baseEntity.extend({
  tourId: objectId,
  reviewerName: z.string().nullable(),
  totalRating: rating,
  restaurantRating: rating.nullable(),
  accommodationRating: rating.nullable(),
  attractionRating: rating.nullable(),
  guideRating: rating.nullable(),
  comment: z.string().nullable(),
  source: z.enum(REVIEW_SOURCES),
  submittedAt: isoDateTime,
});
export type Review = z.infer<typeof review>;

/** POST /tours/:tourId/reviews — 수기 등록 */
export const createReviewRequest = z.object({
  reviewerName: z.string().trim().max(50).nullable().default(null),
  totalRating: rating,
  restaurantRating: rating.nullable().default(null),
  accommodationRating: rating.nullable().default(null),
  attractionRating: rating.nullable().default(null),
  guideRating: rating.nullable().default(null),
  comment: z.string().trim().max(2000).nullable().default(null),
  submittedAt: isoDateTime.optional(),
});
export type CreateReviewRequest = z.input<typeof createReviewRequest>;

export const reviewListQuery = paginationQuery.extend({
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
export type ReviewListQuery = z.input<typeof reviewListQuery>;

/**
 * POST /tours/:tourId/reviews/import — "CSV로 리뷰 저장"
 * 구글 시트/폼 응답의 CSV 공개 URL 을 받아 서버가 내려받아 파싱한다.
 * 허용 호스트는 서버 env REVIEW_IMPORT_ALLOWED_HOSTS 로 제한(SSRF 방지).
 *
 * CSV 헤더 매핑 (한/영 모두 인식):
 *   총점|totalRating (필수), 식당|restaurantRating, 숙소|accommodationRating,
 *   관광지|attractionRating, 가이드|guideRating, 코멘트|comment,
 *   작성자|reviewerName, 제출일시|타임스탬프|submittedAt
 */
export const importReviewsRequest = z.object({
  csvUrl: z.string().url("CSV 주소가 올바르지 않습니다.").refine((u) => u.startsWith("https://"), "https 주소만 허용됩니다."),
});
export type ImportReviewsRequest = z.infer<typeof importReviewsRequest>;

export interface ImportReviewsResult {
  batchId: string;
  totalRows: number;
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export const CSV_HEADER_ALIASES: Record<string, keyof CreateReviewRequest> = {
  총점: "totalRating",
  전체만족도: "totalRating",
  totalrating: "totalRating",
  식당: "restaurantRating",
  restaurantrating: "restaurantRating",
  숙소: "accommodationRating",
  accommodationrating: "accommodationRating",
  관광지: "attractionRating",
  attractionrating: "attractionRating",
  가이드: "guideRating",
  guiderating: "guideRating",
  코멘트: "comment",
  의견: "comment",
  comment: "comment",
  작성자: "reviewerName",
  이름: "reviewerName",
  reviewername: "reviewerName",
  제출일시: "submittedAt",
  타임스탬프: "submittedAt",
  timestamp: "submittedAt",
  submittedat: "submittedAt",
};
