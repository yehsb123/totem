import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ApiError, createApiClient, type AuthTokens } from "@totem/shared";
import { app, signup, useDb } from "./helpers";

useDb();

/**
 * 계약 정합성: 화면이 쓰는 @totem/shared 클라이언트의 모든 메서드가 서버에 실제로 있는 경로를 부르는지.
 * 구 버전의 가장 큰 결함(화면이 부르는 경로가 서버에 없음, AUDIT C1~C13)이 다시 생기지 않게 막는다.
 * 인자는 일부러 엉터리로 넣는다 — 400·404(리소스 없음)·503 은 괜찮고, "경로 자체가 없음" 만 실패로 본다.
 */
let server: Server;
let baseUrl = "";

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

const FAKE_ID = "000000000000000000000000";
const ROUTE_MISSING = "요청한 경로가 없습니다";

describe("클라이언트 ↔ 서버 경로 정합성", () => {
  it("모든 클라이언트 메서드가 존재하는 서버 경로를 부른다", async () => {
    const s = await signup();
    let tokens: AuthTokens | null = { accessToken: s.token, refreshToken: s.refreshToken, expiresIn: 900 };
    const api = createApiClient({
      baseUrl,
      tokenStore: { get: () => tokens, set: (t) => (tokens = t), clear: () => undefined },
    });

    const missing: string[] = [];
    const called: string[] = [];
    // 로그아웃·탈퇴는 토큰을 무효화하므로 맨 마지막에
    const last = new Set(["auth.logout", "users.withdraw"]);
    const entries = Object.entries(api)
      .filter(([, v]) => typeof v === "object" && v !== null)
      .flatMap(([group, methods]) => Object.entries(methods as Record<string, unknown>).map(([name, fn]) => ({ key: `${group}.${name}`, fn })))
      .filter((e): e is { key: string; fn: (...a: unknown[]) => Promise<unknown> } => typeof e.fn === "function")
      .sort((a, b) => Number(last.has(a.key)) - Number(last.has(b.key)));

    for (const { key, fn } of entries) {
      called.push(key);
      try {
        await fn(FAKE_ID, {}, "https://docs.google.com/x");
      } catch (e) {
        if (e instanceof ApiError && e.status === 404 && e.message.startsWith(ROUTE_MISSING)) missing.push(`${key} → ${e.message}`);
        else if (!(e instanceof ApiError)) missing.push(`${key} → 예외 ${String(e)}`);
      }
    }

    expect(missing).toEqual([]);
    // 새 메서드를 추가하면 여기서 목록이 달라진다 — 서버 경로·문서(docs/API.md)도 함께 갱신할 것
    expect(called.length).toBeGreaterThanOrEqual(40);
  });
});

/** Express 라우터를 따라 내려가며 실제 등록된 경로 패턴을 모은다 (:이름 → :p 로 정규화) */
function serverPatterns(): Set<string> {
  const out = new Set<string>();
  type Layer = { route?: { path: string | string[] }; handle?: { stack?: Layer[] } };
  const walk = (stack: Layer[] | undefined) => {
    for (const layer of stack ?? []) {
      if (layer.route) for (const p of ([] as string[]).concat(layer.route.path)) out.add(p.replace(/:[A-Za-z]+/g, ":p"));
      else walk(layer.handle?.stack);
    }
  };
  walk((app as unknown as { router: { stack: Layer[] } }).router.stack);
  return out;
}

/** ROUTES 의 모든 경로(문자열·함수)를 패턴으로 펼친다 */
function contractPatterns(obj: unknown, prefix = ""): { key: string; pattern: string }[] {
  if (typeof obj === "string") return [{ key: prefix, pattern: obj }];
  if (typeof obj === "function") return [{ key: prefix, pattern: (obj as (...a: string[]) => string)(...Array(obj.length).fill(":p")) }];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => contractPatterns(v, prefix ? `${prefix}.${k}` : k));
}

describe("ROUTES ↔ 서버 라우트 표 (정적 대조)", () => {
  it("계약의 모든 경로 패턴이 서버에 글자 그대로 등록돼 있다 (/tours/:id 같은 파라미터 경로에 가려지지 않게)", async () => {
    const { ROUTES } = await import("@totem/shared");
    const server = serverPatterns();
    const missing = contractPatterns(ROUTES)
      .filter(({ pattern }) => !server.has(pattern))
      .map(({ key, pattern }) => `${key}: ${pattern}`);
    expect(missing).toEqual([]);
    expect(server.size).toBeGreaterThan(30);
  });
});

describe("인증 적용 범위 (경로가 바뀌어도 보호가 빠지지 않게)", () => {
  /**
   * 로그인 없이 부를 수 있는 경로는 이 목록뿐이다. 새 공개 경로를 만들면 여기에 명시적으로 추가해야 한다.
   * (인증 미들웨어가 "/maps"·"/schedule" 같은 접두사로 걸려 있어, 계약 경로가 접두사 밖으로 옮겨지면
   *  보호가 조용히 빠질 수 있다 — 이 테스트가 그걸 잡는다)
   */
  const PUBLIC = new Set([
    "/health",
    "/auth/signup",
    "/auth/email-check",
    "/auth/login",
    "/auth/kakao",
    "/auth/refresh",
    "/auth/logout",
    "/auth/handoff/exchange",
    "/auth/find-email",
    "/auth/invitations/:p",
    "/auth/invitations/accept",
  ]);

  it("공개 목록 밖의 모든 계약 경로는 토큰 없이 401", async () => {
    const { ROUTES, API_PREFIX } = await import("@totem/shared");
    const request = (await import("supertest")).default;
    const unprotected: string[] = [];
    for (const { key, pattern } of contractPatterns(ROUTES)) {
      if (PUBLIC.has(pattern)) continue;
      const path = API_PREFIX + pattern.replace(/:p/g, "000000000000000000000000");
      for (const method of ["get", "post", "put", "patch", "delete"] as const) {
        const r = await request(app)[method](path).send({});
        if (r.status !== 401 && r.status !== 404) unprotected.push(`${method.toUpperCase()} ${pattern} (${key}) → ${r.status}`);
        // 404 는 그 메서드가 없는 경우(경로 없음) — 인증 전에 막힐 게 없으므로 허용
        if (r.status === 404 && !String(r.body?.error?.message ?? "").startsWith("요청한 경로가 없습니다")) unprotected.push(`${method.toUpperCase()} ${pattern} → 404(인증 없이 리소스 조회됨)`);
      }
    }
    expect(unprotected).toEqual([]);
  });

  it("공개 경로는 실제로 토큰 없이 동작한다 (401 이 아니다)", async () => {
    const { API_PREFIX } = await import("@totem/shared");
    const request = (await import("supertest")).default;
    for (const p of PUBLIC) {
      const path = API_PREFIX + p.replace(":p", "not-a-real-token-000000");
      const r = p === "/health" || p === "/auth/invitations/:p" ? await request(app).get(path) : await request(app).post(path).send({});
      expect([p, r.status === 401 && p !== "/auth/refresh" && p !== "/auth/handoff/exchange"]).toEqual([p, false]);
    }
  });
});
