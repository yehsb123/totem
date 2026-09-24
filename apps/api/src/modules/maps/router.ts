import { Router } from "express";
import { ROUTES, directionsRequest, localSearchQuery, type DirectionsResult, type LocalSearchItem } from "@totem/shared";
import { env } from "../../config/env";
import { HttpError, notConfigured, ok, parse, upstream } from "../../lib/http";
import { requireAuth } from "../../middlewares/auth";

/**
 * 카카오 REST API 프록시. 구 코드는 REST 키를 브라우저에 하드코딩했다(AUDIT S2).
 * 키는 서버 env 에만 두고 인증된 사용자만 호출하게 한다.
 */
export const mapsRouter = Router();
mapsRouter.use("/maps", requireAuth);

function kakaoHeaders() {
  if (!env.KAKAO_REST_API_KEY) throw notConfigured("카카오 REST API 키(KAKAO_REST_API_KEY)");
  return { Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}` };
}

async function kakaoFetch(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) }).catch(() => {
    throw upstream("카카오 서버에 연결할 수 없습니다.");
  });
  if (res.status === 401 || res.status === 403) throw notConfigured("카카오 REST API 키(권한/도메인 설정 확인)");
  if (!res.ok) throw upstream(`카카오 API 오류 (${res.status})`);
  return res.json();
}

mapsRouter.get(ROUTES.maps.localSearch, async (req, res) => {
  const q = parse(localSearchQuery, req.query);
  const params = new URLSearchParams({ query: q.query, page: String(q.page), size: "15" });
  if (q.x !== undefined && q.y !== undefined) {
    params.set("x", String(q.x));
    params.set("y", String(q.y));
  }
  const json = (await kakaoFetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, { headers: kakaoHeaders() })) as {
    documents: {
      id: string;
      place_name: string;
      address_name: string;
      road_address_name: string;
      phone: string;
      category_name: string;
      x: string;
      y: string;
      place_url: string;
    }[];
  };
  const items: LocalSearchItem[] = json.documents.map((d) => ({
    id: d.id,
    name: d.place_name,
    address: d.address_name,
    roadAddress: d.road_address_name || null,
    phone: d.phone || null,
    categoryName: d.category_name,
    mapX: Number(d.x),
    mapY: Number(d.y),
    url: d.place_url,
  }));
  ok(res, items);
});

mapsRouter.post(ROUTES.maps.directions, async (req, res) => {
  const body = parse(directionsRequest, req.body);
  const json = (await kakaoFetch("https://apis-navi.kakaomobility.com/v1/waypoints/directions", {
    method: "POST",
    headers: { ...kakaoHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, summary: false }),
  })) as {
    routes: {
      result_code: number;
      result_msg: string;
      summary?: { distance: number; duration: number; fare: { taxi: number; toll: number } };
      sections?: { roads: { vertexes: number[] }[] }[];
    }[];
  };
  const route = json.routes?.[0];
  if (!route || route.result_code !== 0 || !route.summary) {
    throw new HttpError(422, "VALIDATION_ERROR", `경로를 찾을 수 없습니다: ${route?.result_msg ?? "알 수 없음"}`);
  }
  const path: [number, number][] = [];
  for (const section of route.sections ?? []) {
    for (const road of section.roads) {
      for (let i = 0; i + 1 < road.vertexes.length; i += 2) path.push([road.vertexes[i], road.vertexes[i + 1]]);
    }
  }
  const result: DirectionsResult = {
    distance: route.summary.distance,
    duration: route.summary.duration,
    taxiFare: route.summary.fare.taxi,
    tollFare: route.summary.fare.toll,
    path,
  };
  ok(res, result);
});
