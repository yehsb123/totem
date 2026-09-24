import pino from "pino";
import { env, isProd, isTest } from "../config/env";

export const logger = pino({
  level: isTest ? "silent" : env.LOG_LEVEL,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.refreshToken", "*.accessToken"],
    censor: "[REDACTED]",
  },
  transport: isProd || isTest ? undefined : { target: "pino-pretty", options: { translateTime: "SYS:HH:MM:ss" } },
});
