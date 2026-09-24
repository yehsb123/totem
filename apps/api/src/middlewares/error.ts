import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import type { ApiErrorBody } from "@totem/shared";
import { isProd } from "../config/env";
import { HttpError } from "../lib/http";
import { logger } from "../lib/logger";

const requestIdOf = (req: Request) => (req.id === undefined ? undefined : String(req.id));

export function notFoundHandler(req: Request, res: Response) {
  const body: ApiErrorBody = { error: { code: "NOT_FOUND", message: `요청한 경로가 없습니다: ${req.method} ${req.path}`, requestId: requestIdOf(req) } };
  res.status(404).json(body);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express 는 인자 4개로 에러 핸들러를 구분한다
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let body: ApiErrorBody = { error: { code: "INTERNAL_ERROR", message: "서버 내부 오류가 발생했습니다." } };

  if (err instanceof HttpError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message, details: err.details } };
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    const fields = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    body = { error: { code: "VALIDATION_ERROR", message: fields[0]?.message ?? "데이터 검증 오류", details: { fields } } };
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    body = { error: { code: "VALIDATION_ERROR", message: `${err.path} 값이 올바르지 않습니다.` } };
  } else if ((err as { code?: number })?.code === 11000) {
    status = 409;
    body = { error: { code: "CONFLICT", message: "이미 존재하는 데이터입니다." } };
  } else if ((err as { type?: string })?.type === "entity.parse.failed") {
    status = 400;
    body = { error: { code: "VALIDATION_ERROR", message: "요청 본문이 올바른 JSON 이 아닙니다." } };
  } else if ((err as { type?: string })?.type === "entity.too.large") {
    status = 413;
    body = { error: { code: "VALIDATION_ERROR", message: "요청 본문이 너무 큽니다." } };
  }

  body.error.requestId = requestIdOf(req);
  if (status >= 500) {
    // req.log 는 요청 ID·사용자가 붙은 로거 (pino-http). 없으면 기본 로거
    (req.log ?? logger).error({ err }, "처리되지 않은 오류");
    if (!isProd && err instanceof Error) body.error.details = { stack: err.stack };
  }
  res.status(status).json(body);
}
