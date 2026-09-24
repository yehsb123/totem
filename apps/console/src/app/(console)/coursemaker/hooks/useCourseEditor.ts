"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createCourseRequest, type Course, type CoursePlace, type Nation } from "@totem/shared";
import { api, errorMessage } from "@/lib/api";
import { today } from "@/lib/format";
import { TIME_SLOTS, fromCourse, placementError, resizeDays, toRequestDays, type EditorDay } from "../courseModel";

export interface TourOptions {
  enabled: boolean;
  type: string;
  managerName: string;
  capacity: number;
}

/**
 * 코스 편집 상태. 편집(끌어놓기·삭제·순서 변경)은 모두 화면 안에서만 하고,
 * "저장"할 때 코스 전체를 한 번에 서버로 보낸다.
 * (구 코드는 장소 하나를 지울 때마다 서버의 '그 일차 전체 삭제' API 를 불렀다 — AUDIT F3)
 */
export function useCourseEditor(courseId: string | null) {
  const [loaded, setLoaded] = useState<Course | null>(null);
  const [loading, setLoading] = useState(!!courseId);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [nation, setNation] = useState<Nation>("KR");
  const [note, setNote] = useState("");
  const [startDate, setStartDateRaw] = useState(today());
  const [endDate, setEndDateRaw] = useState(today());
  const [days, setDays] = useState<EditorDay[]>(() => resizeDays(today(), today(), []));
  const [dayIndex, setDayIndex] = useState(0);
  const [tour, setTour] = useState<TourOptions>({ enabled: true, type: "패키지", managerName: "", capacity: 0 });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    api.courses
      .get(courseId)
      .then((c) => {
        setLoaded(c);
        setTitle(c.title);
        setPickupLocation(c.pickupLocation);
        setNation(c.nation);
        setNote(c.note);
        setStartDateRaw(c.startDate);
        setEndDateRaw(c.endDate);
        setDays(fromCourse(c));
        setDayIndex(0);
        setDirty(false);
      })
      .catch((e) => setLoadError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [courseId]);

  const setPeriod = useCallback((start: string, end: string) => {
    setStartDateRaw(start);
    setEndDateRaw(end);
    setDays((prev) => resizeDays(start, end, prev));
    setDayIndex(0);
    setDirty(true);
  }, []);

  const current = days[dayIndex] ?? null;

  /** 현재 일차의 칸을 바꾼다. 규칙 위반이면 바꾸지 않고 오류 문구를 돌려준다 */
  const mutateDay = useCallback(
    (fn: (slots: (CoursePlace | null)[]) => (CoursePlace | null)[] | string): string | null => {
      const day = days[dayIndex];
      if (!day) return "먼저 코스 기간을 선택해주세요.";
      const r = fn([...day.slots]);
      if (typeof r === "string") return r;
      setDays((prev) => prev.map((d, i) => (i === dayIndex ? { ...d, slots: r } : d)));
      setDirty(true);
      return null;
    },
    [days, dayIndex],
  );

  /** 목록에서 칸으로 추가 (칸이 차 있으면 교체) */
  const dropPlace = useCallback(
    (slotIndex: number, place: CoursePlace) =>
      mutateDay((slots) => {
        const err = placementError(place, slotIndex);
        if (err) return err;
        if (slots.some((p, i) => i !== slotIndex && p?.placeId && p.placeId === place.placeId)) return "같은 날에 이미 담긴 장소입니다.";
        slots[slotIndex] = place;
        return slots;
      }),
    [mutateDay],
  );

  /** 일정 안에서 칸 이동 (대상 칸에 장소가 있으면 서로 바꿈) */
  const moveSlot = useCallback(
    (from: number, to: number) =>
      mutateDay((slots) => {
        if (from === to) return slots;
        const a = slots[from];
        const b = slots[to];
        if (a && placementError(a, to)) return placementError(a, to)!;
        if (b && placementError(b, from)) return placementError(b, from)!;
        slots[to] = a;
        slots[from] = b;
        return slots;
      }),
    [mutateDay],
  );

  const removeSlot = useCallback((slotIndex: number) => mutateDay((slots) => ((slots[slotIndex] = null), slots)), [mutateDay]);

  const buildRequest = () => ({
    title,
    pickupLocation,
    startDate,
    endDate,
    nation,
    note,
    timeSlots: loaded?.timeSlots ?? TIME_SLOTS,
    days: toRequestDays(days),
  });

  /** 서버와 같은 zod 규칙으로 먼저 검증 → 첫 오류 문구를 돌려준다 */
  const validate = (): string | null => {
    const r = createCourseRequest.safeParse(buildRequest());
    return r.success ? null : (r.error.issues[0]?.message ?? "입력값을 확인해주세요.");
  };

  const save = async (): Promise<{ course: Course; createdTour: boolean }> => {
    const body = buildRequest();
    if (loaded) {
      const course = await api.courses.update(loaded.id, body);
      setLoaded(course);
      setDirty(false);
      return { course, createdTour: false };
    }
    const r = await api.courses.create({
      ...body,
      tour: tour.enabled ? { type: tour.type, managerName: tour.managerName, capacity: tour.capacity } : undefined,
    });
    setLoaded(r.course);
    setDirty(false);
    return { course: r.course, createdTour: !!r.tour };
  };

  const placeCount = useMemo(() => days.reduce((n, d) => n + d.slots.filter(Boolean).length, 0), [days]);

  return {
    loaded,
    loading,
    loadError,
    isEdit: !!loaded,
    dirty,
    title,
    setTitle: (v: string) => (setTitle(v), setDirty(true)),
    pickupLocation,
    setPickupLocation: (v: string) => (setPickupLocation(v), setDirty(true)),
    nation,
    setNation: (v: Nation) => (setNation(v), setDirty(true)),
    note,
    setNote: (v: string) => (setNote(v), setDirty(true)),
    startDate,
    endDate,
    setPeriod,
    days,
    dayIndex,
    setDayIndex,
    current,
    timeSlots: loaded?.timeSlots ?? TIME_SLOTS,
    tour,
    setTour,
    dropPlace,
    moveSlot,
    removeSlot,
    placeCount,
    validate,
    save,
  };
}
