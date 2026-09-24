"use client";

import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NATION_LABELS, TOUR_STATUSES, TOUR_STATUS_LABELS, type PageMeta, type Tour, type TourStatus } from "@totem/shared";
import { EmptyState, ErrorState, LoadingState, btn, inputBase, inputClass, useToast } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import TourFormModal from "./components/TourFormModal";

const STATUS_CLASS: Record<TourStatus, string> = {
  planned: "bg-green-600 text-white",
  in_progress: "bg-blue-600 text-white",
  completed: "bg-slate-500 text-white",
  canceled: "bg-red-600 text-white",
};
const PAGE_SIZE = 20;

export default function ToursPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState<TourStatus | "">("");
  const [page, setPage] = useState(1);
  const [types, setTypes] = useState<string[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ initial: Tour | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, t] = await Promise.all([
        api.tours.list({ q: q.trim() || undefined, date: date || undefined, type: type || undefined, status: status || undefined, page, limit: PAGE_SIZE }),
        api.tours.types(),
      ]);
      setTours(list.items);
      setMeta(list.meta);
      setTypes(t);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [q, date, type, status, page]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  /** 표 인라인 수정 — 서버에 즉시 저장하고 응답으로 행을 교체한다 */
  const patch = async (tour: Tour, body: Partial<Pick<Tour, "status" | "capacity" | "bookedSeats">>): Promise<boolean> => {
    try {
      const updated = await api.tours.update(tour.id, body);
      setTours((arr) => arr.map((t) => (t.id === tour.id ? updated : t)));
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    }
  };

  const remove = async (tour: Tour) => {
    if (!window.confirm(`'${tour.title}' 투어를 삭제할까요? 리뷰 기록은 남습니다.`)) return;
    try {
      await api.tours.remove(tour.id);
      toast.success("투어를 삭제했습니다.");
      void load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const resetFilters = () => {
    setQ("");
    setDate("");
    setType("");
    setStatus("");
    setPage(1);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${inputClass} pl-9`} placeholder="투어명 검색" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} />
        </div>
        <input type="date" className={`${inputBase} w-44`} value={date} onChange={(e) => (setDate(e.target.value), setPage(1))} title="이 날짜에 진행 중인 투어" />
        <select className={`${inputBase} w-36`} value={type} onChange={(e) => (setType(e.target.value), setPage(1))}>
          <option value="">모든 타입</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select className={`${inputBase} w-32`} value={status} onChange={(e) => (setStatus(e.target.value as TourStatus | ""), setPage(1))}>
          <option value="">모든 상태</option>
          {TOUR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TOUR_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button className={btn.secondary} onClick={resetFilters}>
          전체보기
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading && tours.length === 0 ? (
          <LoadingState />
        ) : tours.length === 0 ? (
          <EmptyState
            text="조건에 맞는 투어가 없습니다."
            action={
              <Link href="/coursemaker/" className={btn.primary}>
                코스 만들고 투어 등록하기
              </Link>
            }
          />
        ) : (
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-blue-50 text-slate-700">
              <tr>
                <th className="p-3 text-left">투어명</th>
                <th className="p-3">타입</th>
                <th className="p-3">국가</th>
                <th className="p-3">기간</th>
                <th className="p-3">상태</th>
                <th className="p-3">담당자</th>
                <th className="p-3">예상 인원</th>
                <th className="p-3">예약 인원</th>
                <th className="p-3">잔여 좌석</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {tours.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 text-center hover:bg-slate-50">
                  <td className="p-3 text-left font-medium text-slate-900">
                    {t.title}
                    {t.courseId && (
                      <>
                        <Link href={`/coursemaker/?courseId=${t.courseId}`} className="ml-2 text-xs font-normal text-blue-600 hover:underline">
                          코스
                        </Link>
                        <Link href={`/itinerary/?courseId=${t.courseId}`} className="ml-2 text-xs font-normal text-blue-600 hover:underline">
                          일정표
                        </Link>
                      </>
                    )}
                  </td>
                  <td className="p-3">{t.type}</td>
                  <td className="p-3">{NATION_LABELS[t.nation]}</td>
                  <td className="whitespace-nowrap p-3">
                    {t.startDate} ~ {t.endDate}
                  </td>
                  <td className="p-3">
                    <select
                      value={t.status}
                      onChange={(e) => patch(t, { status: e.target.value as TourStatus })}
                      className={`rounded-md px-2 py-1 text-xs font-medium ${STATUS_CLASS[t.status]}`}
                      aria-label="상태 변경"
                    >
                      {TOUR_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-white text-slate-900">
                          {TOUR_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">{t.managerName || "-"}</td>
                  <td className="p-3">
                    <SeatInput value={t.capacity} onCommit={(v) => patch(t, { capacity: v })} label="예상 인원" />
                  </td>
                  <td className="p-3">
                    <SeatInput value={t.bookedSeats} max={t.capacity} onCommit={(v) => patch(t, { bookedSeats: v })} label="예약 인원" />
                  </td>
                  <td className={`p-3 font-semibold ${t.remainingSeats === 0 ? "text-red-600" : "text-slate-800"}`}>{t.remainingSeats}</td>
                  <td className="whitespace-nowrap p-3">
                    <button className="rounded p-1 text-slate-400 hover:text-blue-600" onClick={() => setModal({ initial: t })} aria-label="수정">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1 text-slate-400 hover:text-red-600" onClick={() => remove(t)} aria-label="삭제">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Link href="/coursemaker/" className={btn.primary}>
            <Plus className="h-4 w-4" /> 새 투어 만들기 (코스메이커)
          </Link>
          <button className={btn.secondary} onClick={() => setModal({ initial: null })}>
            코스 없이 투어 추가
          </button>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <button className={btn.secondary} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              이전
            </button>
            <span>
              {meta.page} / {meta.totalPages}
            </span>
            <button className={btn.secondary} disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              다음
            </button>
          </div>
        )}
      </div>

      <TourFormModal
        open={!!modal}
        initial={modal?.initial ?? null}
        onClose={() => setModal(null)}
        onSubmit={async (body) => {
          if (modal?.initial) await api.tours.update(modal.initial.id, body);
          else await api.tours.create(body);
          toast.success("저장했습니다.");
          void load();
        }}
      />
    </div>
  );
}

/** 포커스를 잃거나 Enter 를 누를 때만 저장 (타이핑마다 요청하지 않음) */
function SeatInput({ value, max, onCommit, label }: { value: number; max?: number; onCommit: (v: number) => Promise<boolean>; label: string }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  const commit = async () => {
    const n = Math.max(0, Math.floor(Number(v)));
    if (!Number.isFinite(n) || n === value) return setV(String(value));
    // 서버가 거부하면(예: 예약 > 예상) 원래 값으로 되돌린다
    if (!(await onCommit(n))) setV(String(value));
  };
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={v}
      aria-label={label}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-center"
    />
  );
}
