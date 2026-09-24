import { createApp } from "./app";
import { env } from "./config/env";
import { connectDb, disconnectDb, isMemoryDb } from "./db/connect";
import { seedIfEmpty } from "./db/seed/seed";
import { logger } from "./lib/logger";

async function main() {
  await connectDb();
  if (env.SEED_ON_EMPTY || isMemoryDb()) await seedIfEmpty();

  const server = createApp().listen(env.PORT, () => {
    logger.info(`API 서버 실행: http://localhost:${env.PORT}/api/v1/health`);
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "종료 중");
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.fatal({ err }, "서버 기동 실패");
  process.exit(1);
});
