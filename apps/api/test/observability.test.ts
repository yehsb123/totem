import { describe, expect, it } from "vitest";
import request from "supertest";
import { P, app, authed, signup, useDb } from "./helpers";

useDb();

describe("요청 ID", () => {
  it("모든 응답에 X-Request-Id 가 붙고, 오류 본문의 requestId 와 같다", async () => {
    const ok = await request(app).get(`${P}/health`);
    expect(ok.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);

    const notFound = await request(app).get(`${P}/nope`);
    expect(notFound.status).toBe(404);
    expect(notFound.body.error.requestId).toBe(notFound.headers["x-request-id"]);

    const invalid = await request(app).post(`${P}/auth/login`).send({ email: "x" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.requestId).toBe(invalid.headers["x-request-id"]);
  });

  it("앞단이 준 ID 는 안전한 형식일 때만 이어 쓴다 (로그 주입 방지)", async () => {
    const kept = await request(app).get(`${P}/health`).set("X-Request-Id", "lb-trace-12345678");
    expect(kept.headers["x-request-id"]).toBe("lb-trace-12345678");

    // (줄바꿈이 든 헤더는 Node HTTP 클라이언트가 보내기부터 거부하므로 공백·꺾쇠로 검증)
    const bad = await request(app).get(`${P}/health`).set("X-Request-Id", "evil <script> value");
    expect(bad.headers["x-request-id"]).not.toContain("evil");
    const short = await request(app).get(`${P}/health`).set("X-Request-Id", "abc");
    expect(short.headers["x-request-id"]).not.toBe("abc");
  });

  it("인증된 요청도 ID 가 붙는다 (콘솔 오류 화면에 노출용)", async () => {
    const api = authed((await signup()).token);
    const r = await api.get("/tours/000000000000000000000000");
    expect(r.status).toBe(404);
    expect(r.body.error.requestId).toBe(r.headers["x-request-id"]);
  });

  it("CORS 로 브라우저가 X-Request-Id 헤더를 읽을 수 있다", async () => {
    const r = await request(app).get(`${P}/health`).set("Origin", "http://localhost:3200");
    expect(r.headers["access-control-expose-headers"]).toContain("X-Request-Id");
  });
});

describe("describeApiError (web·console 공통 오류 문구)", () => {
  it("5xx 는 오류 ID 앞 8자리를 덧붙이고, 4xx 는 서버 문구 그대로", async () => {
    const { ApiError, describeApiError } = await import("@totem/shared");
    expect(describeApiError(new ApiError(500, "INTERNAL_ERROR", "서버 내부 오류가 발생했습니다.", undefined, "1234abcd-ffff-4444-8888-000000000000"))).toBe(
      "서버 내부 오류가 발생했습니다. (오류 ID: 1234abcd)",
    );
    expect(describeApiError(new ApiError(400, "VALIDATION_ERROR", "종료일은 시작일과 같거나 이후여야 합니다.", undefined, "1234abcd-x"))).toBe(
      "종료일은 시작일과 같거나 이후여야 합니다.",
    );
    expect(describeApiError(new ApiError(0, "NETWORK_ERROR", "서버에 연결할 수 없습니다."))).toBe("서버에 연결할 수 없습니다.");
    expect(describeApiError("??")).toBe("알 수 없는 오류가 발생했습니다.");
  });
});
