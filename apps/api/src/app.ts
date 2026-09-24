import { randomUUID } from "node:crypto";
import cors from "cors";
import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import { pinoHttp } from "pino-http";
import { API_PREFIX, ROUTES } from "@totem/shared";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { errorHandler, notFoundHandler } from "./middlewares/error";
import { authRouter } from "./modules/auth/router";
import { billingRouter } from "./modules/billing/router";
import { coursesRouter } from "./modules/courses/router";
import { dashboardRouter } from "./modules/dashboard/router";
import { mapsRouter } from "./modules/maps/router";
import { placesRouter } from "./modules/places/router";
import { reviewsRouter } from "./modules/reviews/router";
import { scheduleRouter } from "./modules/schedule/router";
import { toursRouter } from "./modules/tours/router";
import { usersRouter } from "./modules/users/router";

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{8,64}$/;

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(
    pinoHttp({
      logger,
      // 앞단(로드밸런서·프록시)이 준 X-Request-Id 가 안전한 형식이면 이어 쓰고, 아니면 새로 만든다
      genReqId(req, res) {
        const incoming = req.headers["x-request-id"];
        const id = typeof incoming === "string" && REQUEST_ID_RE.test(incoming) ? incoming : randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url === `${API_PREFIX}${ROUTES.health}` },
      customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info"),
      customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
      customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
      // 누가(조직·사용자) 보낸 요청인지 — requireAuth 를 통과한 요청만 값이 있다
      customProps: (req) => {
        const auth = (req as { auth?: { userId: unknown; organizationId: unknown } }).auth;
        return auth ? { userId: String(auth.userId), orgId: String(auth.organizationId) } : {};
      },
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url, ip: req.remoteAddress }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // 서버 간 호출·curl 은 Origin 이 없다
        if (!origin || env.CORS_ORIGINS.includes(origin)) return cb(null, true);
        cb(null, false);
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
      // 브라우저(콘솔)가 오류 화면에 요청 ID 를 보여줄 수 있도록
      exposedHeaders: ["X-Request-Id"],
      maxAge: 600,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: env.RATE_LIMIT_PER_MINUTE,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: { code: "RATE_LIMITED", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." } },
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  // Express 5 는 본문이 없으면 req.body 가 undefined — 검증기가 일관되게 동작하도록 빈 객체로 맞춘다
  app.use((req, _res, next) => {
    req.body ??= {};
    next();
  });

  const api = Router();
  api.get(ROUTES.health, (_req, res) => {
    const db = mongoose.connection.readyState === 1 ? "up" : "down";
    res.status(db === "up" ? 200 : 503).json({ data: { status: db === "up" ? "ok" : "degraded", db, time: new Date().toISOString() } });
  });
  api.use(authRouter);
  api.use(usersRouter);
  api.use(billingRouter);
  api.use(placesRouter);
  api.use(mapsRouter);
  api.use(coursesRouter);
  api.use(toursRouter);
  api.use(reviewsRouter);
  api.use(scheduleRouter);
  api.use(dashboardRouter);

  app.use(API_PREFIX, api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
