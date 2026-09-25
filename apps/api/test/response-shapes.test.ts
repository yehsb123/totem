import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { z, type ZodTypeAny } from "zod";
import {
  billingSummary, course, invitation, member, monthlyTourismStats, payment, place, review, scheduleEvent, scheduleLabel, tour, userProfile,
} from "@totem/shared";
import { seedDemoOrganization, DEMO_EMAIL } from "../src/db/seed/seed";
import { P, app, authed, useDb } from "./helpers";

useDb();

/**
 * 스키마의 모든 객체(중첩 포함)를 strict 로 — 계약에 없는 필드(내부 id·해시·삭제 표시 등)가 응답에 새면 실패,
 * 계약에 있는데 응답에 없거나 형식이 다르면 실패. 화면은 @totem/shared 타입만 믿고 쓰므로 둘이 같아야 한다.
 */
function deepStrict(s: ZodTypeAny): ZodTypeAny {
  if (s instanceof z.ZodObject) return z.object(Object.fromEntries(Object.entries(s.shape).map(([k, v]) => [k, deepStrict(v as ZodTypeAny)]))).strict();
  if (s instanceof z.ZodArray) return z.array(deepStrict(s.element));
  if (s instanceof z.ZodNullable) return deepStrict(s.unwrap()).nullable();
  if (s instanceof z.ZodOptional) return deepStrict(s.unwrap()).optional();
  if (s instanceof z.ZodDefault) return deepStrict(s.removeDefault());
  if (s instanceof z.ZodEffects) return deepStrict(s.innerType());
  return s;
}

function expectShape(name: string, schema: ZodTypeAny, value: unknown) {
  if (Array.isArray(value)) expect(value.length, `${name} 가 비어 있으면 모양을 확인할 수 없다`).toBeGreaterThan(0);
  const r = deepStrict(schema).safeParse(value);
  const problems = r.success ? [] : r.error.issues.map((i) => `${i.path.join(".") || "(루트)"}: ${i.code === "unrecognized_keys" ? `계약에 없는 필드 ${i.keys.join(",")}` : i.message}`);
  expect(problems, name).toEqual([]);
}

it("deepStrict 자체 점검: 중첩 객체의 초과 필드·누락 필드를 잡는다", () => {
  const s = z.object({ a: z.string(), inner: z.object({ b: z.number() }).nullable(), list: z.array(z.object({ c: z.boolean() })) });
  expect(deepStrict(s).safeParse({ a: "x", inner: { b: 1 }, list: [{ c: true }] }).success).toBe(true);
  expect(deepStrict(s).safeParse({ a: "x", inner: { b: 1, secret: "h" }, list: [] }).success).toBe(false);
  expect(deepStrict(s).safeParse({ a: "x", inner: null, list: [{ c: true, extra: 1 }] }).success).toBe(false);
  expect(deepStrict(s).safeParse({ a: "x", list: [] }).success).toBe(false);
});

describe("응답 모양 = @totem/shared 계약 (필드 누락·초과·형식)", () => {
  let api: ReturnType<typeof authed>;
  beforeEach(async () => {
    await seedDemoOrganization("demo-pass-1234");
    const login = await request(app).post(`${P}/auth/login`).send({ email: DEMO_EMAIL, password: "demo-pass-1234" });
    api = authed(login.body.data.accessToken);
  });

  it("사용자·조직·결제", async () => {
    expectShape("GET /users/me", userProfile, (await api.get("/users/me")).body.data);
    expectShape("GET /org/members", z.array(member), (await api.get("/org/members")).body.data);
    await api.post("/org/invitations", { email: "shape@example.com", role: "member" });
    expectShape("GET /org/invitations", z.array(invitation), (await api.get("/org/invitations")).body.data);
    expectShape("GET /billing", billingSummary, (await api.get("/billing")).body.data);
    expectShape("GET /billing/payments", z.array(payment), (await api.get("/billing/payments")).body.data);
  });

  it("장소·코스·투어·리뷰", async () => {
    expectShape("GET /places", z.array(place), (await api.get("/places?limit=5")).body.data);
    const courses = (await api.get("/courses")).body.data;
    const summary = course.pick({ id: true, title: true, startDate: true, endDate: true, pickupLocation: true, createdAt: true, updatedAt: true }).extend({ placeCount: z.number().int(), tourCount: z.number().int() });
    expectShape("GET /courses", z.array(summary), courses);
    expectShape("GET /courses/:id", course, (await api.get(`/courses/${courses[0].id}`)).body.data);
    const tours = (await api.get("/tours")).body.data;
    expectShape("GET /tours", z.array(tour), tours);
    expectShape("GET /tours/:id", tour, (await api.get(`/tours/${tours[0].id}`)).body.data);
    const withReviews = tours.find((t: { reviewStats: { reviewCount: number } }) => t.reviewStats.reviewCount > 0) ?? tours[0];
    expectShape("GET /tours/:id/reviews", z.array(review), (await api.get(`/tours/${withReviews.id}/reviews`)).body.data);
  });

  it("일정·대시보드", async () => {
    expectShape("GET /schedule/labels", z.array(scheduleLabel), (await api.get("/schedule/labels")).body.data);
    expectShape("GET /schedule/events", z.array(scheduleEvent), (await api.get("/schedule/events?from=2020-01-01&to=2030-12-31")).body.data);
    expectShape("GET /dashboard/stats", z.array(monthlyTourismStats), (await api.get("/dashboard/stats?region=jeju")).body.data);
  });
});
