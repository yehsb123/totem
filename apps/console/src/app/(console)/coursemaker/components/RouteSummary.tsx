"use client";

import { Route } from "lucide-react";
import { useMemo, useState } from "react";
import { ApiError, type DirectionsResult } from "@totem/shared";
import { api, errorMessage } from "@/lib/api";
import { dayRoutePoints, routeSignature, type EditorDay } from "../courseModel";

const km = (m: number) => `${(m / 1000).toFixed(1)}km`;
const duration = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h}시간 ${m}분` : `${m}분`;
};

/**
 * 일차 동선 요약 — 카카오모빌리티 길찾기(자동차).
 * 호출 한도가 있어 버튼을 눌렀을 때만 계산하고, 일정이 바뀌면 이전 결과는 무효가 된다(방문 목록 서명으로 비교).
 * 서버에 키가 없으면(503) 버튼 대신 안내 한 줄만 남긴다.
 */
export default function RouteSummary({ day, onRoute }: { day: EditorDay | null; onRoute: (route: { signature: string; path: [number, number][] }) => void }) {
  const points = useMemo(() => (day ? dayRoutePoints(day) : []), [day]);
  const signature = routeSignature(points);
  // 결과·오류는 "어느 방문 목록으로 계산했는지" 와 함께 둔다 — 장소·순서가 바뀌면 지우지 않아도 자동으로 무효
  const [calc, setCalc] = useState<{ signature: string; result: DirectionsResult | null; error: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const current = calc?.signature === signature ? calc : null;
  const result = current?.result ?? null;
  const error = current?.error ?? null;

  if (notConfigured) return <p className="mb-3 text-xs text-slate-400">길찾기(동선 계산)는 서버에 카카오 키가 등록되면 사용할 수 있습니다.</p>;
  if (points.length < 2) return <p className="mb-3 text-xs text-slate-400">장소를 2곳 이상 담으면 이동 거리·시간을 계산할 수 있습니다.</p>;

  const calculate = async () => {
    setLoading(true);
    try {
      const r = await api.maps.directions({
        origin: points[0],
        destination: points[points.length - 1],
        waypoints: points.slice(1, -1),
        priority: "RECOMMEND",
      });
      setCalc({ signature, result: r, error: null });
      onRoute({ signature, path: r.path });
    } catch (e) {
      if (e instanceof ApiError && e.code === "NOT_CONFIGURED") setNotConfigured(true);
      else setCalc({ signature, result: null, error: errorMessage(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-2.5 text-sm">
      {result ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-slate-800">
            <Route className="mr-1 inline h-4 w-4 text-blue-600" />
            {km(result.distance)} · {duration(result.duration)}
          </span>
          <span className="text-xs text-slate-500">
            택시 약 {result.taxiFare.toLocaleString("ko-KR")}원{result.tollFare > 0 && ` · 통행료 ${result.tollFare.toLocaleString("ko-KR")}원`} · 자동차 기준
          </span>
        </div>
      ) : (
        <button className="flex w-full items-center justify-center gap-1.5 text-blue-700 hover:underline disabled:opacity-50" onClick={calculate} disabled={loading}>
          <Route className="h-4 w-4" />
          {loading ? "계산 중…" : `동선 계산 (${points.length}곳)`}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
