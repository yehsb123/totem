import { describe, expect, it } from "vitest";
import request from "supertest";
import { P, app, authed, signup, useDb } from "./helpers";

useDb();

const acceptBody = (token: string, name = "새 멤버") => ({
  token,
  name,
  password: "password1",
  agreements: { terms: true, privacy: true, marketing: false },
});

async function inviteAndJoin(ownerToken: string, email: string, role: "admin" | "member" = "member") {
  const inv = await authed(ownerToken).post("/org/invitations", { email, role });
  expect(inv.status).toBe(201);
  const joined = await request(app).post(`${P}/auth/invitations/accept`).send(acceptBody(inv.body.data.token));
  expect(joined.status).toBe(201);
  return { token: joined.body.data.accessToken as string, user: joined.body.data.user, invitationToken: inv.body.data.token as string };
}

describe("초대", () => {
  it("초대 링크 확인 → 수락하면 그 조직·역할의 계정으로 로그인된다", async () => {
    const owner = await signup({ companyName: "제주여행사" });
    const inv = await authed(owner.token).post("/org/invitations", { email: "New@Example.com", role: "member" });
    expect(inv.body.data.invitation).toMatchObject({ email: "new@example.com", role: "member", status: "pending" });

    const preview = await request(app).get(`${P}/auth/invitations/${inv.body.data.token}`);
    expect(preview.body.data).toMatchObject({ organizationName: "제주여행사", email: "new@example.com", role: "member" });

    const joined = await request(app).post(`${P}/auth/invitations/accept`).send(acceptBody(inv.body.data.token));
    expect(joined.status).toBe(201);
    expect(joined.body.data.user).toMatchObject({ email: "new@example.com", role: "member", organization: { name: "제주여행사" } });

    // 같은 조직 데이터를 본다
    await authed(owner.token).post("/tours", { title: "공유 투어", startDate: "2026-10-01", endDate: "2026-10-01" });
    expect((await authed(joined.body.data.accessToken).get("/tours")).body.data).toHaveLength(1);

    // 초대는 한 번만
    expect((await request(app).post(`${P}/auth/invitations/accept`).send(acceptBody(inv.body.data.token))).status).toBe(410);
    const list = (await authed(owner.token).get("/org/invitations")).body.data;
    expect(list[0].status).toBe("accepted");
  });

  it("재발급하면 이전 링크는 취소되고, 취소한 링크는 쓸 수 없다", async () => {
    const owner = await signup();
    const first = (await authed(owner.token).post("/org/invitations", { email: "a@example.com" })).body.data;
    const second = (await authed(owner.token).post("/org/invitations", { email: "a@example.com" })).body.data;
    expect((await request(app).get(`${P}/auth/invitations/${first.token}`)).status).toBe(410);
    expect((await authed(owner.token).delete(`/org/invitations/${second.invitation.id}`)).status).toBe(204);
    expect((await request(app).post(`${P}/auth/invitations/accept`).send(acceptBody(second.token))).status).toBe(410);
    expect((await request(app).get(`${P}/auth/invitations/nope-nope-nope-nope-nope`)).status).toBe(404);
  });

  it("이미 가입된 이메일은 초대할 수 없고, 멤버는 초대할 수 없으며, 관리자는 관리자를 초대할 수 없다", async () => {
    const owner = await signup();
    const other = await signup({ email: "taken@example.com" });
    void other;
    expect((await authed(owner.token).post("/org/invitations", { email: "taken@example.com" })).status).toBe(409);
    const m = await inviteAndJoin(owner.token, "m@example.com", "member");
    expect((await authed(m.token).post("/org/invitations", { email: "x@example.com" })).status).toBe(403);
    const a = await inviteAndJoin(owner.token, "a@example.com", "admin");
    expect((await authed(a.token).post("/org/invitations", { email: "y@example.com", role: "admin" })).status).toBe(403);
    expect((await authed(a.token).post("/org/invitations", { email: "y@example.com", role: "member" })).status).toBe(201);
  });
});

describe("멤버 관리", () => {
  it("역할 변경은 소유자만, 자기 자신·소유자는 대상이 아니다", async () => {
    const owner = await signup();
    const m = await inviteAndJoin(owner.token, "m@example.com");
    expect((await authed(m.token).patch(`/org/members/${owner.user.id}`, { role: "member" })).status).toBe(403);
    expect((await authed(owner.token).patch(`/org/members/${owner.user.id}`, { role: "admin" })).status).toBe(400);
    const r = await authed(owner.token).patch(`/org/members/${m.user.id}`, { role: "admin" });
    expect(r.body.data.role).toBe("admin");
  });

  it("제외된 멤버는 즉시 로그아웃되고, 같은 이메일로 다시 초대할 수 있다. 관리자는 관리자를 제외할 수 없다", async () => {
    const owner = await signup();
    const a1 = await inviteAndJoin(owner.token, "a1@example.com", "admin");
    const a2 = await inviteAndJoin(owner.token, "a2@example.com", "admin");
    const m = await inviteAndJoin(owner.token, "m@example.com", "member");
    expect((await authed(a1.token).delete(`/org/members/${a2.user.id}`)).status).toBe(403);
    expect((await authed(a1.token).delete(`/org/members/${owner.user.id}`)).status).toBe(403);
    expect((await authed(a1.token).delete(`/org/members/${m.user.id}`)).status).toBe(204);
    expect((await authed(m.token).get("/users/me")).status).toBe(401);
    const members = (await authed(owner.token).get("/org/members")).body.data;
    expect(members.map((x: { role: string }) => x.role)).toEqual(["owner", "admin", "admin"]);
    expect((await authed(owner.token).post("/org/invitations", { email: "m@example.com" })).status).toBe(201);
  });

  it("소유권 이전: 대상이 소유자, 기존 소유자는 관리자 — 그 뒤에야 기존 소유자가 탈퇴할 수 있다", async () => {
    const owner = await signup();
    const m = await inviteAndJoin(owner.token, "m@example.com");
    const withdraw = { password: owner.password, confirm: "탈퇴합니다" };
    const blocked = await authed(owner.token).delete("/users/me", withdraw);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.message).toContain("멤버 관리");

    const r = await authed(owner.token).post("/org/transfer-ownership", { userId: m.user.id });
    expect(r.status).toBe(200);
    const roles = Object.fromEntries(r.body.data.map((x: { id: string; role: string }) => [x.id, x.role]));
    expect(roles[m.user.id]).toBe("owner");
    expect(roles[owner.user.id]).toBe("admin");
    // 기존 소유자는 이제 관리자라 이전·역할 변경 불가
    expect((await authed(owner.token).post("/org/transfer-ownership", { userId: owner.user.id })).status).toBe(403);
    // 관리자가 된 기존 소유자는 탈퇴 가능
    expect((await authed(owner.token).delete("/users/me", withdraw)).status).toBe(204);
  });

  it("다른 조직 멤버는 보이지도 건드려지지도 않는다", async () => {
    const a = await signup();
    const b = await signup();
    expect((await authed(a.token).get("/org/members")).body.data).toHaveLength(1);
    expect((await authed(a.token).patch(`/org/members/${b.user.id}`, { role: "admin" })).status).toBe(404);
    expect((await authed(a.token).delete(`/org/members/${b.user.id}`)).status).toBe(404);
  });
});
