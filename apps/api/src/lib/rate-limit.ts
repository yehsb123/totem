import rateLimit from "express-rate-limit";
import type { ApiErrorBody } from "@totem/shared";

/**
 * IP 당 요청 제한. 초과 응답도 다른 오류와 같은 본문(`error.code`·`message`·**`requestId`**)을 쓴다
 * (예전에는 limiter 마다 고정 message 객체라 requestId 가 빠져 API.md "모든 오류 본문에 requestId" 와 어긋났다 — AUDIT §22).
 */
export function limiter({ windowMs, limit }: { windowMs: number; limit: number }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res, _next, options) => {
      const body: ApiErrorBody = {
        error: { code: "RATE_LIMITED", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", requestId: req.id === undefined ? undefined : String(req.id) },
      };
      res.status(options.statusCode).json(body);
    },
  });
}
