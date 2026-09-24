import { z } from "zod";

/** MongoDB ObjectId 문자열 (24자리 hex) */
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "올바른 ID 형식이 아닙니다.");

/** YYYY-MM-DD */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다.")
  .refine((v) => !Number.isNaN(Date.parse(v)), "존재하지 않는 날짜입니다.");

/** YYYY-MM */
export const isoMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "월은 YYYY-MM 형식이어야 합니다.");

/** HH:mm */
export const clockTime = z.string().regex(/^([01]\d|2[0-4]):[0-5]\d$/, "시간은 HH:mm 형식이어야 합니다.");

/** ISO-8601 datetime (응답의 createdAt 등) */
export const isoDateTime = z.string();

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuery>;

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** 모든 성공 응답은 { data, meta? } 로 감싼다. */
export interface ApiSuccess<T> {
  data: T;
  meta?: PageMeta;
}

/** 모든 실패 응답은 { error: { code, message, details? } } */
export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    /** 서버 로그에서 이 요청을 찾는 ID (응답 헤더 X-Request-Id 와 같다) */
    requestId?: string;
  };
}

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "TOKEN_EXPIRED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "UPSTREAM_ERROR",
  "NOT_CONFIGURED",
  "INTERNAL_ERROR",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

/** 공통 문서 메타 (모든 응답 엔티티) */
export const baseEntity = z.object({
  id: objectId,
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

/** 비밀번호 정책 — 회원가입·비밀번호 변경 공통 */
export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .max(72, "비밀번호는 72자 이하여야 합니다.") // bcrypt 입력 한계
  .regex(/[A-Za-z]/, "비밀번호에 영문자를 포함해주세요.")
  .regex(/\d/, "비밀번호에 숫자를 포함해주세요.");
