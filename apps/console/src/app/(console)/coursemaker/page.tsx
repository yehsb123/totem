"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { MAX_COURSE_DAYS, NATIONS, NATION_LABELS, type CoursePlace, type Nation } from "@totem/shared";
import { ErrorState, LoadingState, btn, inputBase, useToast } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { addDays } from "@/lib/format";
import { env } from "@/lib/env";
import DayPanel from "./components/DayPanel";
import MyCoursesModal from "./components/MyCoursesModal";
import PlacePanel from "./components/PlacePanel";
import { useCourseEditor } from "./hooks/useCourseEditor";
import { useKakaoMap } from "./hooks/useKakaoMap";

function CourseMaker({ courseId }: { courseId: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const c = useCourseEditor(courseId);
  const map = useKakaoMap(c.current);
  const [saving, setSaving] = useState(false);
  const [myCourses, setMyCourses] = useState(false);
  /** lg 미만(휴대폰·태블릿)에서는 세 칸을 탭으로 하나씩 보여준다 */
  const [panel, setPanel] = useState<"places" | "map" | "day">("places");
  const show = (key: typeof panel) => (panel === key ? "flex" : "hidden") + " lg:flex";
  const { relayout } = map;
  useEffect(() => {
    if (panel === "map") requestAnimationFrame(relayout);
  }, [panel, relayout]);

  const onAdd = useCallback(
    (p: CoursePlace) => {
      const r = c.addPlace(p);
      if ("error" in r) return toast.error(r.error);
      toast.success(`${c.dayIndex + 1}일차 ${c.timeSlots[r.slotIndex]}에 담았습니다.`);
    },
    [c, toast],
  );

  /** 저장 안 한 변경이 있으면 이동 전에 확인 */
  const leave = (href: string) => {
    if (c.dirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 이동할까요?")) return;
    router.push(href);
  };
  const backend = useRef(HTML5Backend);

  const notify = useCallback((err: string | null) => err && toast.error(err), [toast]);
  const onDropPlace = useCallback((i: number, p: CoursePlace) => {
    notify(c.dropPlace(i, p));
    map.clearFocus();
  }, [c, map, notify]);
  const onMove = useCallback((from: number, to: number) => notify(c.moveSlot(from, to)), [c, notify]);

  const save = async () => {
    const err = c.validate();
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const { course, createdTour } = await c.save();
      toast.success(createdTour ? "코스를 저장하고 투어관리에 등록했습니다." : "코스를 저장했습니다.");
      if (createdTour) router.push("/tours/");
      else if (!courseId) router.replace(`/coursemaker/?courseId=${course.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (c.loading) return <LoadingState text="코스를 불러오는 중…" />;
  if (c.loadError) return <ErrorState message={c.loadError} />;

  return (
    <DndProvider backend={backend.current}>
      {env.kakaoMapAppKey && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${env.kakaoMapAppKey}&autoload=false`}
          strategy="afterInteractive"
          onReady={map.init}
          onError={() => toast.error("카카오 지도를 불러오지 못했습니다. 앱 키와 등록 도메인을 확인해주세요.")}
        />
      )}
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex flex-shrink-0 flex-wrap items-end gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <label className="flex flex-col text-xs font-medium text-slate-600">
            코스 이름
            <input className={`${inputBase} mt-1 w-56`} value={c.title} onChange={(e) => c.setTitle(e.target.value)} placeholder="예: 제주 동부 2박 3일" />
          </label>
          <label className="flex flex-col text-xs font-medium text-slate-600">
            픽업 장소
            <input className={`${inputBase} mt-1 w-48`} value={c.pickupLocation} onChange={(e) => c.setPickupLocation(e.target.value)} placeholder="예: 제주공항 3번 게이트" />
          </label>
          <label className="flex flex-col text-xs font-medium text-slate-600">
            고객 국가
            <select className={`${inputBase} mt-1 w-28`} value={c.nation} onChange={(e) => c.setNation(e.target.value as Nation)}>
              {NATIONS.map((n) => (
                <option key={n} value={n}>
                  {NATION_LABELS[n]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs font-medium text-slate-600">
            기간
            <div className="mt-1 flex items-center gap-1">
              <input
                type="date"
                className={`${inputBase} w-[150px]`}
                value={c.startDate}
                onChange={(e) => {
                  const s = e.target.value;
                  // 시작일을 종료일 뒤로 옮기면 종료일을 같은 날로 맞춘다 (구 코드는 경고 후 둘 다 지웠다)
                  c.setPeriod(s, c.endDate < s ? s : c.endDate);
                }}
              />
              <span className="text-slate-400">~</span>
              <input type="date" className={`${inputBase} w-[150px]`} value={c.endDate} min={c.startDate} max={c.startDate ? addDays(c.startDate, MAX_COURSE_DAYS - 1) : undefined} onChange={(e) => c.setPeriod(c.startDate, e.target.value)} />
            </div>
          </label>
          {!c.isEdit && (
            <div className="flex items-end gap-2 rounded-md border border-slate-200 px-3 py-1.5">
              <label className="flex items-center gap-1.5 pb-2 text-xs font-medium text-slate-700">
                <input type="checkbox" checked={c.tour.enabled} onChange={(e) => c.setTour({ ...c.tour, enabled: e.target.checked })} />
                투어관리에 등록
              </label>
              {c.tour.enabled && (
                <>
                  <label className="flex flex-col text-xs text-slate-600">
                    타입
                    <input className={`${inputBase} mt-1 w-20 py-1`} value={c.tour.type} onChange={(e) => c.setTour({ ...c.tour, type: e.target.value })} />
                  </label>
                  <label className="flex flex-col text-xs text-slate-600">
                    담당자
                    <input className={`${inputBase} mt-1 w-20 py-1`} value={c.tour.managerName} onChange={(e) => c.setTour({ ...c.tour, managerName: e.target.value })} />
                  </label>
                  <label className="flex flex-col text-xs text-slate-600">
                    예상 인원
                    <input type="number" min={0} className={`${inputBase} mt-1 w-20 py-1`} value={c.tour.capacity} onChange={(e) => c.setTour({ ...c.tour, capacity: Math.max(0, Number(e.target.value)) })} />
                  </label>
                </>
              )}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button className={btn.ghost} onClick={() => setMyCourses(true)}>
              내 코스
            </button>
            {c.isEdit && (
              <button className={btn.ghost} onClick={() => leave("/coursemaker/")}>
                새 코스
              </button>
            )}
            <span className="text-xs text-slate-500">
              {c.days.length}일 · 장소 {c.placeCount}곳{c.dirty && " · 저장 안 됨"}
            </span>
            {c.isEdit && c.loaded && (
              <Link href={`/itinerary/?courseId=${c.loaded.id}`} className={btn.secondary} aria-disabled={c.dirty} onClick={(e) => c.dirty && (e.preventDefault(), toast.error("변경사항을 먼저 저장해주세요."))}>
                일정표 PDF
              </Link>
            )}
            <button className={btn.primary} onClick={save} disabled={saving}>
              {saving ? "저장 중…" : c.isEdit ? "변경사항 저장" : "코스 생성 완료"}
            </button>
          </div>
        </div>

        <div role="tablist" className="flex border-b border-slate-200 bg-white text-sm lg:hidden">
          {([
            ["places", "장소"],
            ["map", "지도"],
            ["day", `일정 (${c.placeCount})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={panel === key}
              onClick={() => setPanel(key)}
              className={`flex-1 py-2.5 font-medium ${panel === key ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-500"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex min-h-0 flex-1">
          <PlacePanel onPlaceClick={(p) => (map.focus(p), setPanel("map"))} onAdd={onAdd} className={show("places")} />
          <main className={`relative flex-1 border-r border-slate-200 bg-blue-50 ${panel === "map" ? "block" : "hidden"} lg:block`}>
            <div ref={map.containerRef} className="h-full w-full" />
            {!map.ready && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-500">
                {env.kakaoMapAppKey ? "지도 불러오는 중…" : "지도 키(NEXT_PUBLIC_KAKAO_MAP_APP_KEY)가 설정되지 않아 지도를 표시하지 않습니다. 코스 편집은 그대로 가능합니다."}
              </div>
            )}
          </main>
          <DayPanel
            day={c.current}
            dayIndex={c.dayIndex}
            dayCount={c.days.length}
            timeSlots={c.timeSlots}
            onPrev={() => c.setDayIndex(Math.max(0, c.dayIndex - 1))}
            onNext={() => c.setDayIndex(Math.min(c.days.length - 1, c.dayIndex + 1))}
            onDropPlace={onDropPlace}
            onMove={onMove}
            onRemove={c.removeSlot}
            onRoute={map.setRoutePath}
            className={show("day")}
          />
        </div>
      </div>
      <MyCoursesModal
        open={myCourses}
        currentId={c.loaded?.id ?? null}
        onClose={() => setMyCourses(false)}
        onOpen={(id) => {
          setMyCourses(false);
          leave(`/coursemaker/?courseId=${id}`);
        }}
      />
    </DndProvider>
  );
}

/** ?courseId 가 바뀌면(내 코스 불러오기·새 코스) key 로 다시 마운트해 이전 편집 상태가 섞이지 않게 한다 */
function CourseMakerRoute() {
  const courseId = useSearchParams().get("courseId");
  return <CourseMaker key={courseId ?? "new"} courseId={courseId} />;
}

export default function CourseMakerPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CourseMakerRoute />
    </Suspense>
  );
}
