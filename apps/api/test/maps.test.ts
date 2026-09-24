import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env";
import { authed, signup, useDb } from "./helpers";

useDb();

const realFetch = globalThis.fetch;
afterEach(() => {
  env.KAKAO_REST_API_KEY = "";
  vi.unstubAllGlobals();
});

/** supertest 는 실제 fetch 를 쓰지 않으므로, 카카오 주소로 가는 호출만 가짜 응답으로 바꾼다 */
function stubKakao(body: unknown, status = 200) {
  const calls: { url: string; auth: string | null }[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (!url.includes("kakao")) return realFetch(input, init);
    calls.push({ url, auth: new Headers(init?.headers).get("Authorization") });
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  });
  return calls;
}

describe("카카오 로컬 검색 프록시", () => {
  it("REST 키가 없으면 503 NOT_CONFIGURED (화면은 안내 문구)", async () => {
    const api = authed((await signup()).token);
    const r = await api.get("/maps/local-search?query=%EC%B9%B4%ED%8E%98");
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe("NOT_CONFIGURED");
  });

  it("키가 있으면 서버에서만 키를 붙여 호출하고, 업종 코드를 코스메이커 분류로 바꾼다", async () => {
    env.KAKAO_REST_API_KEY = "test-rest-key";
    const calls = stubKakao({
      documents: [
        { id: "1", place_name: "해변카페", address_name: "제주시 A", road_address_name: "", phone: "", category_name: "음식점 > 카페", category_group_code: "CE7", x: "126.5", y: "33.5", place_url: "http://place.map.kakao.com/1" },
        { id: "2", place_name: "바다호텔", address_name: "제주시 B", road_address_name: "제주시 B로 1", phone: "064-000-0000", category_name: "여행 > 숙박 > 호텔", category_group_code: "AD5", x: "126.6", y: "33.4", place_url: "http://place.map.kakao.com/2" },
        { id: "3", place_name: "편의점", address_name: "제주시 C", road_address_name: "", phone: "", category_name: "가정,생활 > 편의점", category_group_code: "CS2", x: "126.7", y: "33.3", place_url: "http://place.map.kakao.com/3" },
      ],
    });
    const api = authed((await signup()).token);
    const r = await api.get("/maps/local-search?query=%EC%A0%9C%EC%A3%BC&x=126.5&y=33.4");
    expect(r.status).toBe(200);
    expect(r.body.data.map((d: { category: string }) => d.category)).toEqual(["cafe", "hotel", "etc"]);
    expect(r.body.data[1]).toMatchObject({ name: "바다호텔", roadAddress: "제주시 B로 1", mapX: 126.6, mapY: 33.4 });
    expect(r.body.data[0].roadAddress).toBeNull();
    expect(calls[0].auth).toBe("KakaoAK test-rest-key");
    expect(calls[0].url).toContain("x=126.5");
  });

  it("카카오가 키를 거부하면 503, 로그인 안 하면 401", async () => {
    env.KAKAO_REST_API_KEY = "bad-key";
    stubKakao({ msg: "wrong appKey" }, 401);
    const api = authed((await signup()).token);
    expect((await api.get("/maps/local-search?query=a")).status).toBe(503);
    expect((await authed("nope").get("/maps/local-search?query=a")).status).toBe(401);
  });
});
