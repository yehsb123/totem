import { describe, expect, it } from "vitest";
import request from "supertest";
import { P, app, authed, signup, useDb } from "./helpers";

useDb();

describe("회원가입·로그인", () => {
  it("가입하면 조직·기본 라벨·무료 구독이 함께 생기고 owner 가 된다", async () => {
    const s = await signup({ companyName: "제주여행사" });
    expect(s.user.role).toBe("owner");
    expect(s.user.organization.name).toBe("제주여행사");
    expect(s.user.providers).toEqual(["local"]);

    const api = authed(s.token);
    expect((await api.get("/schedule/labels")).body.data).toHaveLength(3);
    expect((await api.get("/billing")).body.data).toMatchObject({ plan: "trial", subscriptionStatus: "trialing" });
  });

  it("같은 이메일로 두 번 가입하면 409", async () => {
    await signup({ email: "dup@example.com" });
    const res = await request(app)
      .post(`${P}/auth/signup`)
      .send({ email: "DUP@example.com", password: "password1", name: "a", companyName: "b", agreements: { terms: true, privacy: true } });
    expect(res.status).toBe(409);
  });

  it("약관 미동의·약한 비밀번호는 400 과 필드 메시지", async () => {
    const res = await request(app)
      .post(`${P}/auth/signup`)
      .send({ email: "a@b.com", password: "short", name: "a", companyName: "b", agreements: { terms: false, privacy: true } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.fields.length).toBeGreaterThan(0);
  });

  it("이메일 중복 확인", async () => {
    await signup({ email: "taken@example.com" });
    const taken = await request(app).post(`${P}/auth/email-check`).send({ email: "taken@example.com" });
    const free = await request(app).post(`${P}/auth/email-check`).send({ email: "free@example.com" });
    expect(taken.body.data.available).toBe(false);
    expect(free.body.data.available).toBe(true);
  });

  it("틀린 비밀번호와 없는 이메일은 같은 메시지로 401", async () => {
    const s = await signup();
    const wrong = await request(app).post(`${P}/auth/login`).send({ email: s.email, password: "wrongpass1" });
    const none = await request(app).post(`${P}/auth/login`).send({ email: "none@example.com", password: "wrongpass1" });
    expect(wrong.status).toBe(401);
    expect(none.status).toBe(401);
    expect(wrong.body.error.message).toBe(none.body.error.message);
  });
});

describe("토큰", () => {
  it("refresh 는 새 토큰으로 회전하고, 옛 토큰을 재사용하면 모든 세션이 폐기된다", async () => {
    const s = await signup();
    const r1 = await request(app).post(`${P}/auth/refresh`).send({ refreshToken: s.refreshToken });
    expect(r1.status).toBe(200);
    const next = r1.body.data.refreshToken;
    expect(next).not.toBe(s.refreshToken);

    const reuse = await request(app).post(`${P}/auth/refresh`).send({ refreshToken: s.refreshToken });
    expect(reuse.status).toBe(401);
    const afterTheft = await request(app).post(`${P}/auth/refresh`).send({ refreshToken: next });
    expect(afterTheft.status).toBe(401);
  });

  it("logout 한 refresh token 은 더 이상 못 쓴다", async () => {
    const s = await signup();
    expect((await request(app).post(`${P}/auth/logout`).send({ refreshToken: s.refreshToken })).status).toBe(204);
    expect((await request(app).post(`${P}/auth/refresh`).send({ refreshToken: s.refreshToken })).status).toBe(401);
  });

  it("web → console 인계 코드는 한 번만 교환된다", async () => {
    const s = await signup();
    const h = await authed(s.token).post("/auth/handoff");
    expect(h.status).toBe(201);
    const first = await request(app).post(`${P}/auth/handoff/exchange`).send({ code: h.body.data.code });
    expect(first.status).toBe(200);
    expect(first.body.data.user.email).toBe(s.email);
    const second = await request(app).post(`${P}/auth/handoff/exchange`).send({ code: h.body.data.code });
    expect(second.status).toBe(401);
  });

  it("토큰 없이/엉터리 토큰으로 보호 API 호출 시 401", async () => {
    expect((await request(app).get(`${P}/tours`)).status).toBe(401);
    expect((await request(app).get(`${P}/tours`).set("Authorization", "Bearer nope")).status).toBe(401);
  });
});

describe("사용자 설정", () => {
  it("프로필·알림 수정", async () => {
    const api = authed((await signup()).token);
    const p = await api.patch("/users/me", { name: "새이름", phone: "010-1234-5678" });
    expect(p.body.data.name).toBe("새이름");
    const n = await api.patch("/users/me/notifications", { push: true });
    expect(n.body.data.notifications).toEqual({ email: true, push: true });
  });

  it("비밀번호 변경 후 기존 세션은 폐기되고 새 비밀번호로 로그인된다", async () => {
    const s = await signup();
    const api = authed(s.token);
    expect((await api.put("/users/me/password", { currentPassword: "bad", newPassword: "newpass123" })).status).toBe(400);
    expect((await api.put("/users/me/password", { currentPassword: s.password, newPassword: "newpass123" })).status).toBe(204);
    expect((await request(app).post(`${P}/auth/refresh`).send({ refreshToken: s.refreshToken })).status).toBe(401);
    expect((await request(app).post(`${P}/auth/login`).send({ email: s.email, password: "newpass123" })).status).toBe(200);
  });

  it("탈퇴하면 개인정보가 지워지고 같은 토큰·이메일로 다시 쓸 수 없다", async () => {
    const s = await signup();
    const api = authed(s.token);
    expect((await api.delete("/users/me", { password: s.password, confirm: "틀림" })).status).toBe(400);
    expect((await api.delete("/users/me", { password: s.password, confirm: "탈퇴합니다" })).status).toBe(204);
    expect((await api.get("/users/me")).status).toBe(401);
    expect((await request(app).post(`${P}/auth/login`).send({ email: s.email, password: s.password })).status).toBe(401);
    // 이메일이 비워졌으므로 같은 이메일로 재가입 가능
    await signup({ email: s.email });
  });

  it("아이디 찾기는 마스킹된 이메일만 준다", async () => {
    await signup({ email: "abcdef@example.com", name: "홍길동", phone: "010-1111-2222" });
    const r = await request(app).post(`${P}/auth/find-email`).send({ name: "홍길동", phone: "010-1111-2222" });
    expect(r.body.data.maskedEmail).toBe("abc***@example.com");
  });
});
