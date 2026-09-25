import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import request from "supertest";
import { ApiError, createApiClient, type AuthTokens, type TokenStore } from "@totem/shared";
import { P, app, useDb } from "./helpers";

useDb();

let server: Server;
let base = "";
beforeAll(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

/** 여러 탭이 같은 localStorage 를 쓰는 상황 — 저장소 하나를 클라이언트 여럿이 공유 */
function sharedStore(initial: AuthTokens): TokenStore & { value: AuthTokens | null } {
  const s = {
    value: initial as AuthTokens | null,
    get: () => s.value,
    set: (t: AuthTokens) => void (s.value = t),
    clear: () => void (s.value = null),
  };
  return s;
}

/** 브라우저 Web Locks 의 최소 대역 (Node 22 에는 navigator.locks 가 없다) */
function stubLocks() {
  let tail = Promise.resolve();
  const locks = {
    request: <T>(_name: string, fn: () => Promise<T>) => {
      const run = tail.then(fn);
      tail = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  };
  vi.stubGlobal("navigator", { locks });
}

async function login() {
  const email = `tab${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`;
  const r = await request(app)
    .post(`${P}/auth/signup`)
    .send({ email, password: "password1", name: "탭", companyName: "탭 회사", agreements: { terms: true, privacy: true, marketing: false } });
  const { accessToken, refreshToken, expiresIn } = r.body.data;
  return { accessToken, refreshToken, expiresIn } as AuthTokens;
}

describe("API 클라이언트 토큰 갱신", () => {
  it("탭 두 개가 동시에 만료돼도 refresh 는 한 번 → 둘 다 성공, 세션이 폐기되지 않는다", async () => {
    stubLocks();
    const tokens = await login();
    const store = sharedStore({ ...tokens, accessToken: "expired-access-token" });
    const onUnauthorized = vi.fn();
    const tabA = createApiClient({ baseUrl: base, tokenStore: store, onUnauthorized });
    const tabB = createApiClient({ baseUrl: base, tokenStore: store, onUnauthorized });

    const [a, b] = await Promise.all([tabA.users.me(), tabB.users.me()]);
    expect(a.id).toBe(b.id);
    expect(onUnauthorized).not.toHaveBeenCalled();
    // 한 번만 회전됐으므로 지금 저장된 refresh token 은 여전히 유효 (재사용 탐지로 전 세션 폐기가 일어나지 않음)
    const again = await request(app).post(`${P}/auth/refresh`).send({ refreshToken: store.value!.refreshToken });
    expect(again.status).toBe(200);
    vi.unstubAllGlobals();
  });

  it("refresh 중 네트워크가 끊기면 로그아웃하지 않고 연결 오류로 알린다", async () => {
    const tokens = await login();
    const store = sharedStore({ ...tokens, accessToken: "expired-access-token" });
    const onUnauthorized = vi.fn();
    const flaky: typeof fetch = (input, init) =>
      String(input).endsWith("/auth/refresh") ? Promise.reject(new TypeError("Failed to fetch")) : fetch(input, init);
    const client = createApiClient({ baseUrl: base, tokenStore: store, onUnauthorized, fetchImpl: flaky });

    const err = await client.users.me().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe("NETWORK_ERROR");
    expect(store.value?.refreshToken).toBe(tokens.refreshToken);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("서버가 refresh 를 거절하면 토큰을 지우고 재로그인으로 보낸다", async () => {
    const store = sharedStore({ accessToken: "expired", refreshToken: "not-a-real-refresh-token", expiresIn: 900 } as AuthTokens);
    const onUnauthorized = vi.fn();
    const client = createApiClient({ baseUrl: base, tokenStore: store, onUnauthorized });
    await client.users.me().catch(() => undefined);
    expect(store.value).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
