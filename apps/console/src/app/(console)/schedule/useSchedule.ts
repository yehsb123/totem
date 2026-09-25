"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CreateEventRequest, ScheduleEvent, ScheduleLabel, UpdateEventRequest, UpsertLabelRequest } from "@totem/shared";
import { api, errorMessage } from "@/lib/api";
import { addDays, toLocalDate, toMonth } from "@/lib/format";

/** 달력 6주(42칸)가 보여주는 첫날·마지막 날 — 앞뒤 달 날짜의 일정도 함께 받아온다 */
export function visibleRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const start = toLocalDate(new Date(y, m - 1, 1 - first.getDay()));
  return { from: start, to: addDays(start, 41) };
}

export function useSchedule() {
  const [month, setMonth] = useState(() => toMonth(new Date()));
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [labels, setLabels] = useState<ScheduleLabel[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  // 로딩·오류는 "어느 조회(기간·검색어)에 대한 결과인지" 로 판단한다 — effect 안에서 직접 켜고 끄지 않음
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const range = useMemo(() => visibleRange(month), [month]);

  const loadLabels = useCallback(async () => setLabels(await api.schedule.labels()), []);

  // 라벨 유무와 무관하게 일정을 조회한다 (구 코드는 라벨이 0개면 일정을 아예 안 불러왔다 — AUDIT F11)
  const loadEvents = useCallback(async () => {
    setEvents(await api.schedule.events({ ...range, q: debouncedQuery || undefined }));
  }, [range, debouncedQuery]);

  const queryKey = `${range.from}|${range.to}|${debouncedQuery}|${retry}`;
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.schedule.labels(), api.schedule.events({ ...range, q: debouncedQuery || undefined })])
      .then(([l, e]) => {
        if (cancelled) return;
        setLabels(l);
        setEvents(e);
        setLoadedKey(queryKey);
      })
      .catch((e) => !cancelled && setFailure({ key: queryKey, message: errorMessage(e) }));
    return () => {
      cancelled = true;
    };
  }, [queryKey, range, debouncedQuery]);

  /**
   * 검색은 **전체 기간**에서 — 달력 조회는 보이는 달로 한정돼, 다른 달의 일정을 검색하면
   * 빈 달력만 보여 "없는 일정"처럼 보였다 (AUDIT §28). 결과 목록을 누르면 그 달로 이동한다.
   */
  const [search, setSearch] = useState<{ key: string; items: ScheduleEvent[] } | null>(null);
  const [searchVersion, setSearchVersion] = useState(0);
  const searchKey = `${debouncedQuery}|${searchVersion}`;
  useEffect(() => {
    if (!debouncedQuery) return;
    let cancelled = false;
    api.schedule
      .events({ q: debouncedQuery })
      .then((items) => !cancelled && setSearch({ key: searchKey, items }))
      .catch(() => undefined); // 검색 목록 실패는 달력 조회 오류 화면이 이미 알린다
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, searchKey]);
  const searchResults = debouncedQuery ? (search?.key === searchKey ? search.items : null) : null;
  const searching = !!debouncedQuery && searchResults === null;

  const error = failure?.key === queryKey ? failure.message : null;
  const loading = loadedKey !== queryKey && !error;
  /** 오류 화면의 [다시 시도] — 이벤트 핸들러에서 조회 키를 바꿔 다시 불러온다 */
  const reload = useCallback(() => setRetry((n) => n + 1), []);

  /**
   * 저장·삭제 뒤 목록 갱신. 저장은 이미 성공했으므로 갱신 실패를 "저장 실패"로 알리면 안 된다
   * (사용자가 다시 눌러 일정이 두 번 생긴다) → 실패하면 조회를 다시 걸어 화면의 오류·재시도로 넘긴다.
   */
  const refreshAfterWrite = useCallback(
    (what: "all" | "labels" = "all") => {
      setSearchVersion((n) => n + 1); // 검색 중이면 결과 목록도 새로
      return (what === "all" ? Promise.all([loadEvents(), loadLabels()]) : loadLabels()).then(() => undefined, reload);
    },
    [loadEvents, loadLabels, reload],
  );

  const labelById = useMemo(() => new Map(labels.map((l) => [l.id, l])), [labels]);

  return {
    month,
    setMonth,
    query,
    setQuery,
    labels,
    labelById,
    events,
    searchResults,
    searching,
    loading,
    error,
    reload,
    createEvent: async (body: CreateEventRequest) => {
      const e = await api.schedule.createEvent(body);
      await refreshAfterWrite();
      return e;
    },
    updateEvent: async (id: string, body: UpdateEventRequest) => {
      const e = await api.schedule.updateEvent(id, body);
      await refreshAfterWrite();
      return e;
    },
    removeEvent: async (id: string) => {
      await api.schedule.removeEvent(id);
      await refreshAfterWrite();
    },
    saveLabel: async (id: string | null, body: UpsertLabelRequest) => {
      const l = id ? await api.schedule.updateLabel(id, body) : await api.schedule.createLabel(body);
      await refreshAfterWrite("labels");
      return l;
    },
    removeLabel: async (id: string, reassignTo?: string) => {
      await api.schedule.removeLabel(id, reassignTo);
      await refreshAfterWrite();
    },
  };
}
