import type { Response } from "express";
import type { ZodType, ZodTypeDef } from "zod";
import type { ErrorCode, PageMeta } from "@totem/shared";

/** 핸들러에서 throw 하면 에러 미들웨어가 { error } 응답으로 바꾼다 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, "VALIDATION_ERROR", message, details);
export const unauthorized = (message = "로그인이 필요합니다.") => new HttpError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "권한이 없습니다.") => new HttpError(403, "FORBIDDEN", message);
export const notFound = (what: string) => new HttpError(404, "NOT_FOUND", `${what}을(를) 찾을 수 없습니다.`);
export const conflict = (message: string, details?: unknown) => new HttpError(409, "CONFLICT", message, details);
export const notConfigured = (what: string) =>
  new HttpError(503, "NOT_CONFIGURED", `${what} 이(가) 서버에 설정되지 않았습니다. 관리자에게 문의하세요.`);
export const upstream = (message: string) => new HttpError(502, "UPSTREAM_ERROR", message);

/** zod 로 입력을 검증하고, 실패하면 필드별 메시지를 담아 400 을 던진다 */
export function parse<T>(schema: ZodType<T, ZodTypeDef, unknown>, input: unknown): T {
  const r = schema.safeParse(input ?? {});
  if (r.success) return r.data;
  const fields = r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
  throw badRequest(fields[0]?.message ?? "입력값이 올바르지 않습니다.", { fields });
}

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ data });
}

export function okPaged<T>(res: Response, data: T[], meta: { page: number; limit: number; total: number }) {
  const body: { data: T[]; meta: PageMeta } = {
    data,
    meta: { ...meta, totalPages: Math.max(1, Math.ceil(meta.total / meta.limit)) },
  };
  return res.json(body);
}

export const noContent = (res: Response) => res.status(204).end();

/** 정규식 특수문자 이스케이프 (사용자 검색어를 $regex 에 넣을 때) */
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
