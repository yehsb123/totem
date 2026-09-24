"use client";

import Link from "next/link";
import { Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CourseSummary, PageMeta } from "@totem/shared";
import { EmptyState, ErrorState, LoadingState, Modal, btn, inputBase, useToast } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";

const PAGE = 10;

/** 저장한 코스 목록 — 불러오기(편집)·일정표·삭제 */
export default function MyCoursesModal({ open, currentId, onClose, onOpen }: { open: boolean; currentId: string | null; onClose: () => void; onOpen: (id: string) => void }) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CourseSummary[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.courses.list({ q: q.trim() || undefined, page, limit: PAGE });
      setItems(r.items);
      setMeta(r.meta);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [open, load]);

  const remove = async (c: CourseSummary) => {
    if (!window.confirm(`'${c.title}' 코스를 삭제할까요?`)) return;
    try {
      await api.courses.remove(c.id);
      toast.success("코스를 삭제했습니다.");
      void load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="내 코스" width="max-w-2xl">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className={`${inputBase} w-full pl-9`} placeholder="코스 이름 검색" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} autoFocus />
      </div>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading && items.length === 0 ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState text={q ? "검색 결과가 없습니다." : "저장한 코스가 없습니다."} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((c) => (
            <li key={c.id} className={`flex items-center gap-3 py-3 ${c.id === currentId ? "bg-blue-50/60" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-900">
                  {c.title}
                  {c.id === currentId && <span className="ml-2 text-xs text-blue-600">편집 중</span>}
                </div>
                <div className="text-xs text-slate-500">
                  {c.startDate} ~ {c.endDate} · 장소 {c.placeCount}곳{c.tourCount > 0 && ` · 투어 ${c.tourCount}건 연결`}
                </div>
              </div>
              <button className={btn.secondary} onClick={() => onOpen(c.id)}>
                불러오기
              </button>
              <Link href={`/itinerary/?courseId=${c.id}`} className={btn.ghost}>
                일정표
              </Link>
              <button
                className="rounded p-2 text-slate-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                onClick={() => remove(c)}
                disabled={c.tourCount > 0}
                title={c.tourCount > 0 ? "연결된 투어를 먼저 삭제해야 코스를 지울 수 있습니다." : "삭제"}
                aria-label="코스 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {meta && meta.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
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
    </Modal>
  );
}
