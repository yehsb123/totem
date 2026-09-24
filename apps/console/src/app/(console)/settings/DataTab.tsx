"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlaceSyncResult, PlaceSyncStatus } from "@totem/shared";
import { ErrorState, LoadingState, btn, useToast } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("ko-KR") : "-");

/**
 * 설정 > 데이터 관리 (소유자·관리자) — 코스메이커 장소 목록의 출처인 관광정보(TourAPI) 동기화.
 * 장소는 모든 조직이 함께 쓰는 공용 데이터라 서버가 동기화 간격을 강제한다.
 */
export default function DataTab() {
  const toast = useToast();
  const [status, setStatus] = useState<PlaceSyncStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<PlaceSyncResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.places
      .syncStatus()
      .then((s) => !cancelled && setStatus(s))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [version]);

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await api.places.sync({});
      setResult(r);
      toast.success(`관광정보 ${r.fetched.toLocaleString("ko-KR")}건을 받았습니다.`);
      setVersion((v) => v + 1);
    } catch (e) {
      toast.error(errorMessage(e));
      setVersion((v) => v + 1);
    } finally {
      setSyncing(false);
    }
  };

  if (error)
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setVersion((v) => v + 1);
        }}
      />
    );
  if (!status) return <LoadingState />;

  const blocked = !status.configured || !!status.nextAvailableAt;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-slate-800">데이터 관리</h2>
      <section className="rounded-lg border border-slate-200 p-5">
        <h3 className="mb-1 text-lg font-semibold text-slate-800">관광정보 (한국관광공사 TourAPI) — 제주</h3>
        <p className="mb-4 text-sm text-slate-600">코스메이커 ‘관광정보’ 목록의 출처입니다. 모든 조직이 함께 쓰는 데이터라 한 번 받으면 일정 시간 동안 다시 받을 수 없습니다.</p>
        <dl className="mb-4 grid max-w-xl grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-600">사용 가능한 장소</dt>
          <dd className="font-semibold">{status.total.toLocaleString("ko-KR")}곳</dd>
          <dt className="text-slate-600">그중 TourAPI 에서 받은 곳</dt>
          <dd className="font-semibold">{status.tourapiCount.toLocaleString("ko-KR")}곳{status.tourapiCount === 0 && <span className="ml-1 font-normal text-slate-500">(지금은 샘플 장소만)</span>}</dd>
          <dt className="text-slate-600">마지막 동기화</dt>
          <dd className="font-semibold">{fmt(status.lastSyncedAt)}</dd>
          {status.nextAvailableAt && (
            <>
              <dt className="text-slate-600">다음 가능 시각</dt>
              <dd className="font-semibold">{fmt(status.nextAvailableAt)}</dd>
            </>
          )}
        </dl>
        {!status.configured && (
          <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            서버에 TourAPI 서비스키(<code>TOURAPI_SERVICE_KEY</code>)가 등록되지 않아 동기화할 수 없습니다. 운영 담당자에게 요청해주세요.
          </p>
        )}
        <button className={btn.primary} onClick={sync} disabled={blocked || syncing}>
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "받는 중… (수십 초 걸릴 수 있습니다)" : "지금 동기화"}
        </button>
        {result && (
          <p className="mt-3 text-sm text-slate-600">
            받은 {result.fetched.toLocaleString("ko-KR")}건 · 새로 추가 {result.upserted.toLocaleString("ko-KR")}건 · 갱신 {result.modified.toLocaleString("ko-KR")}건
          </p>
        )}
      </section>
    </div>
  );
}
