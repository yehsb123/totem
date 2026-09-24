"use client";

import { useEffect, useRef, useState } from "react";
import { useDrag } from "react-dnd";
import { PLACE_CATEGORIES, PLACE_CATEGORY_LABELS, type Place, type PlaceCategory, type PlaceSort } from "@totem/shared";
import { inputClass } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { DND, snapshot, type DragPlace } from "../courseModel";

const PAGE = 30;
const SORTS: { value: PlaceSort; label: string }[] = [
  { value: "popularity", label: "인기순" },
  { value: "foreignPopularity", label: "외국인 인기순" },
  { value: "title", label: "이름순" },
];

function PlaceItem({ place, onClick }: { place: Place; onClick: (p: Place) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag<DragPlace, unknown, { isDragging: boolean }>(
    () => ({ type: DND.PLACE, item: { kind: DND.PLACE, place: snapshot(place) }, collect: (m) => ({ isDragging: m.isDragging() }) }),
    [place],
  );
  drag(ref);
  const img = place.thumbnailUrl ?? place.imageUrl;
  return (
    <div
      ref={ref}
      onClick={() => onClick(place)}
      className={`flex cursor-grab items-center gap-3 rounded-lg border bg-white p-2.5 shadow-sm transition-opacity ${isDragging ? "border-dashed border-blue-400 opacity-50" : "border-slate-200 hover:border-blue-300"}`}
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element -- 외부 이미지(TourAPI) + 정적 export
        <img src={img} alt="" width={48} height={48} className="h-12 w-12 flex-shrink-0 rounded-md object-cover" loading="lazy" />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-blue-100 text-sm font-semibold text-blue-700">{place.title.slice(0, 2)}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-800">{place.title}</div>
        <div className="truncate text-xs text-slate-500">
          <span className="mr-1 rounded bg-slate-100 px-1 text-slate-600">{PLACE_CATEGORY_LABELS[place.category]}</span>
          {place.addr1}
        </div>
      </div>
    </div>
  );
}

export default function PlacePanel({ onPlaceClick }: { onPlaceClick: (p: Place) => void }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [sort, setSort] = useState<PlaceSort>("popularity");
  const [items, setItems] = useState<Place[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 검색어·카테고리·정렬이 바뀌면 1페이지부터 다시 (구 코드는 이 값들이 조회에 연결돼 있지 않았다 — AUDIT F2)
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await api.places.list({ q: q.trim() || undefined, category: category === "all" ? undefined : category, sort, page: 1, limit: PAGE });
        if (cancelled) return;
        setItems(r.items);
        setTotal(r.meta.total);
        setPage(1);
      } catch (e) {
        if (!cancelled) setError(errorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, category, sort]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const r = await api.places.list({ q: q.trim() || undefined, category: category === "all" ? undefined : category, sort, page: page + 1, limit: PAGE });
      setItems((a) => [...a, ...r.items]);
      setPage(page + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors ${active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`;

  return (
    <aside className="flex w-[290px] flex-shrink-0 flex-col border-r border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-base font-bold text-slate-900">장소 선택</h3>
      <input className={`${inputClass} mb-3`} placeholder="장소·주소 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mb-2 flex flex-wrap gap-1.5">
        {SORTS.map((s) => (
          <button key={s.value} className={chip(sort === s.value)} onClick={() => setSort(s.value)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button className={chip(category === "all")} onClick={() => setCategory("all")}>
          전체
        </button>
        {PLACE_CATEGORIES.map((c) => (
          <button key={c} className={chip(category === c)} onClick={() => setCategory(c)}>
            {PLACE_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs text-slate-500">{total.toLocaleString()}곳 · 끌어서 오른쪽 일정에 놓으세요</p>
      <div className="-mr-2 flex-1 space-y-2 overflow-y-auto pr-2">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && !loading && items.length === 0 && <p className="mt-4 text-center text-sm text-slate-500">검색 결과가 없습니다.</p>}
        {items.map((p) => (
          <PlaceItem key={p.id} place={p} onClick={onPlaceClick} />
        ))}
        {items.length < total && (
          <button className="w-full rounded-md py-2 text-sm text-blue-600 hover:bg-blue-50" onClick={loadMore} disabled={loading}>
            {loading ? "불러오는 중…" : "더 보기"}
          </button>
        )}
        {loading && items.length === 0 && <p className="mt-4 text-center text-sm text-slate-500">불러오는 중…</p>}
      </div>
    </aside>
  );
}
