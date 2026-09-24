import { describe, expect, it } from "vitest";
import request from "supertest";
import { Course, Organization, Payment, Review, ScheduleEvent, Tour, User } from "../src/db/models";
import { purgeDeletedOrganizations } from "../src/db/purge";
import { P, app, authed, signup, useDb } from "./helpers";

useDb();

const DAY_MS = 86_400_000;

/** 조직 하나에 투어·리뷰·일정·결제를 만들고 소유자가 탈퇴(=조직 삭제 표시)한다 */
async function orgWithDataThenWithdraw() {
  const s = await signup();
  const api = authed(s.token);
  const tour = (await api.post("/tours", { title: "T", startDate: "2026-10-01", endDate: "2026-10-01" })).body.data;
  await api.post(`/tours/${tour.id}/reviews`, { totalRating: 5 });
  await api.post("/schedule/events", { name: "E", startDate: "2026-10-01", endDate: "2026-10-01" });
  const invite = (await api.post("/org/invitations", { email: "later@example.com" })).body.data;
  const orgId = s.user.organization.id;
  await Payment.create({ organizationId: orgId, paidAt: new Date(), product: "Basic 플랜 (월간)", amount: 29000, status: "paid" });
  // 탈퇴 전에 access token 을 하나 더 확보해 둔다 (남은 토큰으로 접근 시도용)
  const leftover = s.token;
  expect((await api.delete("/users/me", { password: s.password, confirm: "탈퇴합니다" })).status).toBe(204);
  return { orgId, leftover, inviteToken: invite.token as string };
}

describe("조직 삭제 표시 후 접근 차단", () => {
  it("남은 토큰·대기 초대로는 삭제된 조직에 접근할 수 없다", async () => {
    const { orgId, leftover, inviteToken } = await orgWithDataThenWithdraw();
    expect((await Organization.findById(orgId).lean())?.deletedAt).toBeTruthy();
    expect((await authed(leftover).get("/tours")).status).toBe(401);
    expect((await request(app).get(`${P}/auth/invitations/${inviteToken}`)).status).toBe(410);
  });

  it("사용자 상태를 우회해 되살려도(비정상 경로) 조직이 삭제 표시면 요청·로그인이 막힌다", async () => {
    const s = await signup();
    await Organization.updateOne({ _id: s.user.organization.id }, { $set: { deletedAt: new Date() } });
    expect((await authed(s.token).get("/users/me")).status).toBe(401);
    const login = await request(app).post(`${P}/auth/login`).send({ email: s.email, password: s.password });
    expect(login.status).toBe(401);
    expect(login.body.error.message).toBe("삭제된 조직입니다.");
  });
});

describe("삭제된 조직 영구 정리 (npm run purge)", () => {
  it("유예 기간 전에는 지우지 않고, 지난 뒤에는 결제 기록만 남기고 모두 지운다", async () => {
    const { orgId } = await orgWithDataThenWithdraw();
    const other = await signup();
    await authed(other.token).post("/tours", { title: "다른 조직 투어", startDate: "2026-10-01", endDate: "2026-10-01" });

    const early = await purgeDeletedOrganizations(30);
    expect(early.organizations).toBe(0);
    expect(await Tour.countDocuments({ organizationId: orgId })).toBe(1);

    const later = await purgeDeletedOrganizations(30, new Date(Date.now() + 31 * DAY_MS));
    expect(later.organizations).toBe(1);
    for (const Model of [Tour, Review, ScheduleEvent, Course, User]) {
      expect(await (Model as typeof Tour).countDocuments({ organizationId: orgId })).toBe(0);
    }
    expect(await Payment.countDocuments({ organizationId: orgId })).toBe(1);
    const tomb = await Organization.findById(orgId).lean();
    expect(tomb).toMatchObject({ name: "삭제된 조직" });
    expect(tomb?.purgedAt).toBeTruthy();

    // 다른 조직은 그대로, 다시 돌려도 안전
    expect((await authed(other.token).get("/tours")).body.data).toHaveLength(1);
    expect((await purgeDeletedOrganizations(30, new Date(Date.now() + 40 * DAY_MS))).organizations).toBe(0);
  });
});
