import mongoose from "mongoose";
import { env, isProd } from "../config/env";
import { logger } from "../lib/logger";

let memoryServer: { stop: () => Promise<boolean> } | null = null;

/**
 * MONGO_URI 가 있으면 그 DB 에, 없으면(개발·테스트만) 인메모리 MongoDB 를 띄워 연결한다.
 * 연결에 실패하면 예외를 던져 서버가 뜨지 않게 한다 — DB 없이 떠 있으면 모든 요청이 타임아웃된다.
 */
export async function connectDb(uri = env.MONGO_URI) {
  let target = uri;
  if (!target) {
    if (isProd) throw new Error("MONGO_URI 가 설정되지 않았습니다.");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const server = await MongoMemoryServer.create();
    memoryServer = server;
    target = server.getUri();
    logger.warn("MONGO_URI 가 없어 인메모리 MongoDB 로 실행합니다 (재시작하면 데이터가 사라집니다).");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(target, { dbName: env.MONGO_DB_NAME, serverSelectionTimeoutMS: 10_000 });
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
