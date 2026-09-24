/**
 * npm run purge — 삭제 표시 후 ORG_PURGE_AFTER_DAYS 일이 지난 조직 데이터를 영구 삭제 (결제 기록은 보존).
 * 운영에서는 하루 1회 예약 실행(cron·스케줄러)을 권장. 여러 번 실행해도 안전하다.
 */
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { connectDb, disconnectDb } from "./connect";
import { purgeDeletedOrganizations } from "./purge";

async function run() {
  await connectDb();
  const r = await purgeDeletedOrganizations(env.ORG_PURGE_AFTER_DAYS);
  logger.info({ afterDays: env.ORG_PURGE_AFTER_DAYS, ...r }, "삭제된 조직 정리 완료");
  await disconnectDb();
}

run().catch(async (err) => {
  logger.fatal({ err }, "조직 정리 실패");
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
