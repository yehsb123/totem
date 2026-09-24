import mongoose from "mongoose";
import { env, isProd } from "../config/env";
import { logger } from "../lib/logger";

let memoryServer: { stop: () => Promise<boolean> } | null = null;

/**
 * MONGO_URI 가 있으면 그 DB 에, 없으면(개발·테스트만) 인메모리 MongoDB 를 띄워 연결한다.
 * 연결에 실패하면 예외를 던져 서버가 뜨지 않게 한다 — DB 없이 떠 있으면 모든 요청이 타임아웃된다.
 */
async function startMemoryServer() {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const server = await MongoMemoryServer.create();
  memoryServer = server;
  return server.getUri();
}

export async function connectDb(uri = env.MONGO_URI) {
  mongoose.set("strictQuery", true);
  const opts = { dbName: env.MONGO_DB_NAME, serverSelectionTimeoutMS: 10_000 };

  if (!uri) {
    if (isProd) throw new Error("MONGO_URI 가 설정되지 않았습니다.");
    await mongoose.connect(await startMemoryServer(), opts);
    logger.warn("MONGO_URI 가 없어 인메모리 MongoDB 로 실행합니다 (재시작하면 데이터가 사라집니다).");
  } else {
    try {
      await mongoose.connect(uri, opts);
    } catch (err) {
      // 운영은 여기서 기동 실패. 개발은 옛 주소·네트워크 문제로 막히지 않도록 인메모리로 대신 뜬다
      if (isProd || env.NODE_ENV === "test") throw err;
      logger.error({ err: (err as Error).message }, "MONGO_URI 연결 실패");
      logger.warn("⚠ 개발 모드라 인메모리 MongoDB 로 대신 실행합니다. 실제 DB 가 아닙니다! apps/api/.env 의 MONGO_URI 를 확인하세요.");
      await mongoose.disconnect().catch(() => undefined);
      await mongoose.connect(await startMemoryServer(), opts);
    }
  }
  await mongoose.connection.syncIndexes();
  logger.info({ db: env.MONGO_DB_NAME, memory: !!memoryServer }, "MongoDB 연결됨");
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

export const isMemoryDb = () => memoryServer !== null;
