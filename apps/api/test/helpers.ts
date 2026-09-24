import { afterAll, beforeAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app";
import { connectDb, disconnectDb } from "../src/db/connect";
import { seedReferenceData } from "../src/db/seed/seed";

export const app = createApp();
export const P = "/api/v1";

/** 파일마다 인메모리 Mongo 하나. 각 테스트 전에 컬렉션을 비우고 공용 데이터만 다시 넣는다 */
export function useDb() {
  beforeAll(async () => {
    await connectDb("");
  });
  beforeEach(async () => {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
    await seedReferenceData();
  });
  afterAll(async () => {
    await disconnectDb();
  });
}

let seq = 0;
export async function signup(overrides: Record<string, unknown> = {}) {
  seq++;
  const body = {
    email: `user${seq}@example.com`,
    password: "password1",
    name: `사용자${seq}`,
    companyName: `회사${seq}`,
    agreements: { terms: true, privacy: true, marketing: false },
    ...overrides,
  };
  const res = await request(app).post(`${P}/auth/signup`).send(body);
  if (res.status !== 201) throw new Error(`signup failed ${res.status} ${JSON.stringify(res.body)}`);
  return {
    token: res.body.data.accessToken as string,
    refreshToken: res.body.data.refreshToken as string,
    user: res.body.data.user,
    email: body.email,
    password: body.password,
  };
}

export const authed = (token: string) => ({
  get: (url: string) => request(app).get(P + url).set("Authorization", `Bearer ${token}`),
  post: (url: string, body?: object) => request(app).post(P + url).set("Authorization", `Bearer ${token}`).send(body ?? {}),
  put: (url: string, body?: object) => request(app).put(P + url).set("Authorization", `Bearer ${token}`).send(body ?? {}),
  patch: (url: string, body?: object) => request(app).patch(P + url).set("Authorization", `Bearer ${token}`).send(body ?? {}),
  delete: (url: string, body?: object) => request(app).delete(P + url).set("Authorization", `Bearer ${token}`).send(body ?? {}),
});
