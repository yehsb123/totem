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

  it("속도 제한(429) 응답도 같은 오류 본문 + requestId", async () => {
    let last!: request.Response;
    for (let i = 0; i < 11; i++) last = await request(app).post(`${P}/auth/email-check`).send({ email: `limit${i}@example.com` });
    expect(last.status).toBe(429);
    expect(last.body.error).toMatchObject({ code: "RATE_LIMITED", message: expect.stringContaining("요청이 너무 많습니다") });
    expect(last.body.error.requestId).toBe(last.headers["x-request-id"]);
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

describe("접근 로그 비밀값 가리기", () => {
  it("초대 토큰 경로·token/code/refreshToken 쿼리를 가린다 (수락 경로·다른 쿼리는 그대로)", async () => {
    const { redactUrl } = await import("../src/lib/redact");
    expect(redactUrl("/api/v1/auth/invitations/abc123SECRETtoken")).toBe("/api/v1/auth/invitations/[REDACTED]");
    expect(redactUrl("/api/v1/auth/invitations/abc123SECRET?x=1")).toBe("/api/v1/auth/invitations/[REDACTED]?x=1");
    expect(redactUrl("/api/v1/auth/invitations/accept")).toBe("/api/v1/auth/invitations/accept");
    expect(redactUrl("/cb?code=HANDOFF&next=/schedule/")).toBe("/cb?code=[REDACTED]&next=/schedule/");
    expect(redactUrl("/x?page=2&token=abc&refreshToken=zzz")).toBe("/x?page=2&token=[REDACTED]&refreshToken=[REDACTED]");
    expect(redactUrl("/api/v1/tours?q=code")).toBe("/api/v1/tours?q=code");
  });

  it("앱이 pino 에 넘기는 로그 메시지·직렬화기가 초대 토큰 원문을 남기지 않는다", async () => {
    const { accessLogMessage, accessLogSerializers } = await import("../src/app");
    const req = { id: "r1", method: "GET", url: "/api/v1/auth/invitations/SuperSecretInviteToken1234", remoteAddress: "1.2.3.4" };
    type Msg = Parameters<typeof accessLogMessage>;
    const line = accessLogMessage(req as unknown as Msg[0], { statusCode: 410 } as unknown as Msg[1]) + JSON.stringify(accessLogSerializers.req(req));
    expect(line).toContain("/auth/invitations/[REDACTED]");
    expect(line).not.toContain("SuperSecretInviteToken1234");
  });
});

describe("sanitizeNext (web·console 공통 오픈 리다이렉트 방지)", () => {
  it("내부 경로만 통과, //·/\·외부 주소·제어문자는 거부", async () => {
    const { sanitizeNext } = await import("@totem/shared");
    expect(sanitizeNext("/schedule/")).toBe("/schedule/");
    expect(sanitizeNext("/coursemaker/?courseId=abc")).toBe("/coursemaker/?courseId=abc");
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "evil.com", "/ok\nSet-Cookie:x", "", null, undefined]) {
      expect(sanitizeNext(bad as string | null)).toBeNull();
    }
  });
});

describe("검증 오류 문구는 한국어 (web·console 폼과 API 400 이 같은 문구)", () => {
  it("스키마에 문구가 없는 길이·숫자·형식 오류도 영어로 나가지 않는다", async () => {
    const { createTourRequest, updateTourRequest, findEmailRequest } = await import("@totem/shared");
    const msg = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message;
    expect(msg(createTourRequest.safeParse({ title: "가".repeat(101), startDate: "2026-10-01", endDate: "2026-10-01" }))).toBe("100자 이하로 입력해주세요.");
    expect(msg(updateTourRequest.safeParse({ capacity: 10001 }))).toBe("10,000 이하여야 합니다.");
    expect(msg(updateTourRequest.safeParse({ capacity: 1.5 }))).toBe("정수로 입력해주세요.");
    expect(msg(findEmailRequest.safeParse({ name: "홍길동", phone: "0".repeat(21) }))).toBe("20자 이하로 입력해주세요.");
    // 스키마에 직접 적은 문구가 우선
    expect(msg(createTourRequest.safeParse({ title: " ", startDate: "2026-10-01", endDate: "2026-10-01" }))).toBe("투어명을 입력해주세요.");
  });

  it("API 400 응답의 message·details 도 한국어", async () => {
    const api = authed((await signup()).token);
    const r = await api.post("/tours", { title: "가".repeat(101), startDate: "2026-10-01", endDate: "2026-10-01" });
    expect(r.status).toBe(400);
    expect(JSON.stringify(r.body.error)).not.toMatch(/String must|Number must|Expected|Required/);
    expect(r.body.error.details.fields[0]).toMatchObject({ path: "title", message: "100자 이하로 입력해주세요." });
  });
});

describe("오류 문구 조사", () => {
  it("받침에 맞춰 을/를·이/가 (괄호 설명은 건너뜀, 한글이 아니면 두 형태)", async () => {
    const { josa, notFound, notConfigured } = await import("../src/lib/http");
    expect(josa("계정", "을", "를")).toBe("계정을");
    expect(josa("투어", "을", "를")).toBe("투어를");
    expect(josa("카카오 REST API 키(KAKAO_REST_API_KEY)", "이", "가")).toBe("카카오 REST API 키(KAKAO_REST_API_KEY)가");
    expect(josa("TourAPI 서비스키(TOURAPI_SERVICE_KEY)", "이", "가")).toBe("TourAPI 서비스키(TOURAPI_SERVICE_KEY)가");
    expect(josa("API", "이", "가")).toBe("API이(가)");
    expect(notFound("일치하는 계정").message).toBe("일치하는 계정을 찾을 수 없습니다.");
    expect(notFound("대기 중인 초대").message).toBe("대기 중인 초대를 찾을 수 없습니다.");
    expect(notConfigured("카카오 로그인(KAKAO_REST_API_KEY)").message).toContain("카카오 로그인(KAKAO_REST_API_KEY)이 서버에");
  });
});
