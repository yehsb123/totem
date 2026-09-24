/**
 * npm run seed — MONGO_URI 의 DB 에 공용 데이터(대시보드 통계·장소 샘플)를 upsert 하고,
 * SEED_DEMO_PASSWORD 가 있으면 데모 조직/계정도 만든다. 여러 번 실행해도 안전하다.
 */
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { connectDb, disconnectDb, isMemoryDb } from "../connect";
import { seedDemoOrganization, seedReferenceData } from "./seed";

async function run() {
  await connectDb();
  if (isMemoryDb()) logger.warn("MONGO_URI 가 없어 인메모리 DB 에 시드합니다 — 종료하면 사라집니다.");
  await seedReferenceData();
  if (env.SEED_DEMO_PASSWORD) await seedDemoOrganization(env.SEED_DEMO_PASSWORD);
  else logger.info("SEED_DEMO_PASSWORD 가 없어 데모 계정은 만들지 않았습니다.");
  await disconnectDb();
}

run().catch(async (err) => {
  logger.fatal({ err }, "시드 실패");
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
