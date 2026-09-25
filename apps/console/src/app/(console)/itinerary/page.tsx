"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileDown } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { HOTEL_SLOT_INDEX, NATION_LABELS, PLACE_CATEGORY_LABELS, type Course, type Tour } from "@totem/shared";
import { EmptyState, ErrorState, LoadingState, btn } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { formatDateKo, parseLocalDate } from "@/lib/format";
import { useSession } from "@/lib/session";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 투어 일정표 — 요금제(Basic)의 "투어 일정 PDF 생성".
 * 브라우저 인쇄로 PDF 를 만든다 (인쇄 시 사이드바·헤더·버튼은 globals.css 의 print 규칙으로 숨김).
 */
function Itinerary() {
  const courseId = useSearchParams().get("courseId");
  const { user } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [tour, setTour] = useState<Tour | null>(null);
  const [fetchError, setError] = useState<string | null>(null);
  const error = courseId ? fetchError : null;

  useEffect(() => {
    if (!courseId) return;
    api.courses
      .get(courseId)
      .then(async (c) => {
        setCourse(c);
        if (c.tourIds[0]) setTour(await api.tours.get(c.tourIds[0]).catch(() => null));
      })
      .catch((e) => setError(errorMessage(e)));
  }, [courseId]);

  // 주소에 코스가 없으면(북마크·직접 입력) 오류가 아니라 고르는 곳으로 안내
  if (!courseId)
    return (
      <EmptyState
        text="일정표를 볼 코스를 먼저 고르세요."
        action={
          <Link href="/coursemaker/" className={btn.primary}>
            코스메이커에서 내 코스 열기
          </Link>
        }
      />
    );
  if (error) return <ErrorState message={error} />;
  if (!course) return <LoadingState />;

  const dayLabel = (date: string) => `${WEEKDAYS[parseLocalDate(date).getDay()]}요일`;

  return (
    <div className="mx-auto max-w-4xl p-6 print:max-w-none print:p-0">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href={`/coursemaker/?courseId=${course.id}`} className="text-sm text-blue-600 hover:underline">
          ← 코스 편집으로
        </Link>
        <button className={btn.primary} onClick={() => window.print()}>
          <FileDown className="h-4 w-4" /> PDF로 저장(인쇄)
        </button>
      </div>

      <article className="rounded-lg bg-white p-8 shadow-sm print:rounded-none print:shadow-none">
        <header className="border-b-2 border-slate-800 pb-4">
          <p className="text-xs text-slate-500">{user.organization.name} · 투어 일정표</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{course.title}</h1>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">기간</dt>
              <dd>
                <span className="whitespace-nowrap">{course.startDate}</span> ~ <span className="whitespace-nowrap">{course.endDate}</span> ({course.days.length}일)
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">픽업</dt>
              <dd>{course.pickupLocation || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">고객 국가</dt>
              <dd>{NATION_LABELS[course.nation]}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">담당 · 인원</dt>
              <dd>{tour ? `${tour.managerName || "-"} · ${tour.bookedSeats}/${tour.capacity}명` : "-"}</dd>
            </div>
          </dl>
        </header>

        {course.days.map((day) => {
          const hotel = day.slots.find((s) => s.slotIndex === HOTEL_SLOT_INDEX);
          const stops = day.slots.filter((s) => s.slotIndex !== HOTEL_SLOT_INDEX).sort((a, b) => a.slotIndex - b.slotIndex);
          return (
            <section key={day.date} className="mt-6 break-inside-avoid">
              <h2 className="mb-2 flex items-baseline gap-2 text-base font-semibold text-slate-900">
                {day.dayNumber}일차 <span className="text-sm font-normal text-slate-500">{formatDateKo(`${day.date}T00:00:00`)} {dayLabel(day.date)}</span>
              </h2>
              {stops.length === 0 && !hotel ? (
                <p className="text-sm text-slate-500">자유 일정</p>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-y border-slate-300 bg-slate-50 text-left text-xs text-slate-600">
                      <th className="w-28 px-2 py-1.5">시간</th>
                      <th className="px-2 py-1.5">장소</th>
                      <th className="w-20 px-2 py-1.5">구분</th>
                      <th className="px-2 py-1.5">주소</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stops.map((s) => (
                      <tr key={s.slotIndex} className="border-b border-slate-200">
                        <td className="px-2 py-1.5 tabular-nums">{course.timeSlots[s.slotIndex]}</td>
                        <td className="px-2 py-1.5 font-medium text-slate-900">{s.place.title}</td>
                        <td className="px-2 py-1.5">{PLACE_CATEGORY_LABELS[s.place.category]}</td>
                        <td className="px-2 py-1.5 text-slate-600">{s.place.addr1 ?? ""}</td>
                      </tr>
                    ))}
                    {hotel && (
                      <tr className="border-b border-slate-200 bg-slate-50/60">
                        <td className="px-2 py-1.5">숙박</td>
                        <td className="px-2 py-1.5 font-medium text-slate-900">{hotel.place.title}</td>
                        <td className="px-2 py-1.5">{PLACE_CATEGORY_LABELS.hotel}</td>
                        <td className="px-2 py-1.5 text-slate-600">{hotel.place.addr1 ?? ""}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}

        {course.note && (
          <section className="mt-6 border-t border-slate-200 pt-3 text-sm text-slate-700">
            <h2 className="mb-1 font-semibold">안내</h2>
            <p className="whitespace-pre-wrap">{course.note}</p>
          </section>
        )}
        <footer className="mt-8 text-right text-xs text-slate-400">Totem · 출력일 {formatDateKo(new Date().toISOString())}</footer>
      </article>
    </div>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Itinerary />
    </Suspense>
  );
}
