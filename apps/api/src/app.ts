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

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === `${API_PREFIX}${ROUTES.health}` } }));
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // 서버 간 호출·curl 은 Origin 이 없다
        if (!origin || env.CORS_ORIGINS.includes(origin)) return cb(null, true);
        cb(null, false);
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
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
