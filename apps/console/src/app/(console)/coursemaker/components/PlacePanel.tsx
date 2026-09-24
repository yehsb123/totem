"use client";

import { useEffect, useRef, useState } from "react";
import { useDrag } from "react-dnd";
import { ApiError, PLACE_CATEGORIES, PLACE_CATEGORY_LABELS, type LocalSearchItem, type Place, type PlaceCategory, type PlaceSort } from "@totem/shared";
import { inputClass } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { DND, snapshot, snapshotFromKakao, type DragPlace } from "../courseModel";

const PAGE = 30;
const SORTS: { value: PlaceSort; label: string }[] = [
  { value: "popularity", label: "인기순" },
  { value: "foreignPopularity", label: "외국인 인기순" },
  { value: "title", label: "이름순" },
];

type MapPoint = { title: string; mapX: number; mapY: number };

function PlaceItem({ place, onClick }: { place: Place; onClick: (p: MapPoint) => void }) {
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

/** 관광정보(TourAPI 캐시) 목록 — 검색·정렬·카테고리 */
function TourPlaceList({ onPlaceClick }: { onPlaceClick: (p: MapPoint) => void }) {
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
    <>
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
    </>
  );
}

function KakaoItem({ item, onClick }: { item: LocalSearchItem; onClick: (p: MapPoint) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const place = snapshotFromKakao(item);
  const [{ isDragging }, drag] = useDrag<DragPlace, unknown, { isDragging: boolean }>(
    () => ({ type: DND.PLACE, item: { kind: DND.PLACE, place: snapshotFromKakao(item) }, collect: (m) => ({ isDragging: m.isDragging() }) }),
    [item],
  );
  drag(ref);
  return (
    <div
      ref={ref}
      onClick={() => onClick(place)}
      className={`cursor-grab rounded-lg border bg-white p-2.5 shadow-sm ${isDragging ? "border-dashed border-blue-400 opacity-50" : "border-slate-200 hover:border-blue-300"}`}
    >
      <div className="truncate text-sm font-semibold text-slate-800">{item.name}</div>
      <div className="truncate text-xs text-slate-500">
        <span className="mr-1 rounded bg-slate-100 px-1 text-slate-600">{PLACE_CATEGORY_LABELS[item.category]}</span>
        {item.roadAddress ?? item.address}
      </div>
      <div className="truncate text-[11px] text-slate-400">{item.categoryName}</div>
    </div>
  );
}

/** 제주 중심 좌표 — 같은 이름이면 제주 근처 결과가 먼저 오도록 */
const JEJU = { x: 126.55, y: 33.38 };

/** 관광정보에 없는 곳(단골 식당·픽업 장소 등)을 카카오 키워드 검색으로 찾아 담는다 */
function KakaoSearchList({ onPlaceClick }: { onPlaceClick: (p: MapPoint) => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<LocalSearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await api.maps.localSearch({ query: q, ...JEJU }));
    } catch (err) {
      if (err instanceof ApiError && err.code === "NOT_CONFIGURED") setNotConfigured(true);
      else setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (notConfigured) {
    return (
      <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
        카카오 검색이 서버에 설정되지 않았습니다. 관리자가 API 서버에 <code>KAKAO_REST_API_KEY</code> 를 등록하면 사용할 수 있습니다. 그동안은 관광정보 목록을 이용하세요.
      </p>
    );
  }
  return (
    <>
      <form onSubmit={search} className="mb-3 flex gap-2">
        <input className={inputClass} placeholder="가게·장소 이름 (예: 제주 흑돼지)" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button
          type="submit"
          className="whitespace-nowrap rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || !query.trim()}
        >
          검색
        </button>
      </form>
      <p className="mb-2 text-xs text-slate-500">카카오 지도 검색 결과 · 끌어서 일정에 놓으세요</p>
      <div className="-mr-2 flex-1 space-y-2 overflow-y-auto pr-2">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-4 text-center text-sm text-slate-500">검색 중…</p>}
        {!loading && items?.length === 0 && <p className="mt-4 text-center text-sm text-slate-500">검색 결과가 없습니다.</p>}
        {!loading && items?.map((k) => <KakaoItem key={k.id} item={k} onClick={onPlaceClick} />)}
      </div>
    </>
  );
}

const TABS = [
  { key: "tour", label: "관광정보" },
  { key: "kakao", label: "카카오 검색" },
] as const;

export default function PlacePanel({ onPlaceClick }: { onPlaceClick: (p: MapPoint) => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("tour");
  return (
    <aside className="flex w-[290px] flex-shrink-0 flex-col border-r border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">장소 선택</h3>
        <div role="tablist" className="flex rounded-md bg-slate-100 p-0.5 text-xs">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded px-2 py-1 font-medium ${tab === t.key ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* 탭을 바꿔도 각 목록의 검색 상태가 유지되도록 숨김으로 전환 */}
      <div className={`${tab === "tour" ? "flex" : "hidden"} min-h-0 flex-1 flex-col`}>
        <TourPlaceList onPlaceClick={onPlaceClick} />
      </div>
      <div className={`${tab === "kakao" ? "flex" : "hidden"} min-h-0 flex-1 flex-col`}>
        <KakaoSearchList onPlaceClick={onPlaceClick} />
      </div>
    </aside>
  );
}
