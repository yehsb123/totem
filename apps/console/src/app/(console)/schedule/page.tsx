"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ScheduleEvent, ScheduleLabel } from "@totem/shared";
import { ErrorState, LoadingState, btn, inputBase, useToast } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { formatMonthKo, parseLocalDate, shiftMonth, today, toMonth } from "@/lib/format";
import { colorOf } from "@/lib/labelColors";
import DeleteLabelModal from "./components/DeleteLabelModal";
import EventFormModal from "./components/EventFormModal";
import LabelFormModal from "./components/LabelFormModal";
import MonthCalendar from "./components/MonthCalendar";
import { useSchedule } from "./useSchedule";

export default function SchedulePage() {
  const s = useSchedule();
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  const [eventModal, setEventModal] = useState<{ initial: ScheduleEvent | null; preset: ScheduleLabel | null } | null>(null);
  const [labelModal, setLabelModal] = useState<{ initial: ScheduleLabel | null } | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<ScheduleLabel | null>(null);

  const dayEvents = s.events.filter((e) => e.startDate <= selectedDate && e.endDate >= selectedDate);
  const detail = selectedEvent ? (s.events.find((e) => e.id === selectedEvent.id) ?? null) : null;

  const removeEvent = async (ev: ScheduleEvent) => {
    if (!window.confirm(`'${ev.name}' 일정을 삭제할까요?`)) return;
    try {
      await s.removeEvent(ev.id);
      setSelectedEvent(null);
      toast.success("일정을 삭제했습니다.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  /** 검색 결과에서 고르면 그 일정이 있는 달로 달력을 옮기고 상세를 연다 */
  const openFromSearch = (e: ScheduleEvent) => {
    s.setMonth(toMonth(parseLocalDate(e.startDate)));
    setSelectedDate(e.startDate);
    setSelectedEvent(e);
  };

  // 선택한 날짜의 일정 / 일정 상세 — 데스크톱은 오른쪽 사이드바, 좁은 화면은 달력 아래에 같은 내용
  const sidePanel = (
    <>
        {!detail && s.query.trim() ? (
          <>
            <h4 className="mb-3 font-semibold text-slate-800">
              검색 결과 <span className="text-sm font-normal text-slate-500">{s.searchResults ? `전체 기간 ${s.searchResults.length}건` : "찾는 중…"}</span>
            </h4>
            {s.searchResults?.length === 0 && <p className="text-sm text-slate-500">일치하는 일정이 없습니다.</p>}
            <ul className="space-y-2">
              {(s.searchResults ?? []).map((e) => {
                const l = e.labelId ? s.labelById.get(e.labelId) : undefined;
                return (
                  <li key={e.id}>
                    <button className="w-full rounded-md border border-slate-200 p-3 text-left hover:bg-slate-50" onClick={() => openFromSearch(e)}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${colorOf(l?.color).dot}`} />
                        <span className="truncate text-sm font-medium">{e.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {e.startDate} ~ {e.endDate}
                        {e.manager && ` · ${e.manager}`}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : detail ? (
          <EventDetail
            event={detail}
            label={detail.labelId ? s.labelById.get(detail.labelId) : undefined}
            onBack={() => setSelectedEvent(null)}
            onEdit={() => setEventModal({ initial: detail, preset: null })}
            onDelete={() => removeEvent(detail)}
          />
        ) : (
          <>
            <h4 className="mb-3 font-semibold text-slate-800">{selectedDate} 일정</h4>
            {dayEvents.length === 0 ? (
              <p className="text-sm text-slate-500">이 날짜에는 일정이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {dayEvents.map((e) => {
                  const l = e.labelId ? s.labelById.get(e.labelId) : undefined;
                  return (
                    <li key={e.id}>
                      <button className="w-full rounded-md border border-slate-200 p-3 text-left hover:bg-slate-50" onClick={() => setSelectedEvent(e)}>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${colorOf(l?.color).dot}`} />
                          <span className="truncate text-sm font-medium">{e.name}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {e.startDate} ~ {e.endDate}
                          {e.manager && ` · ${e.manager}`}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <button className={`${btn.secondary} mt-4 w-full`} onClick={() => setEventModal({ initial: null, preset: null })}>
              <Plus className="h-4 w-4" /> 이 날짜에 일정 추가
            </button>
          </>
        )}
    </>
  );

  return (
    <div className="flex h-full min-h-[calc(100vh-3.5rem)] flex-col">
      {/* 상단 도구 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-md border border-slate-300">
            <button className="p-2 hover:bg-slate-100" onClick={() => s.setMonth(shiftMonth(s.month, -1))} aria-label="이전 달">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <label className="relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              {formatMonthKo(s.month)}
              <input
                type="month"
                value={s.month}
                onChange={(e) => e.target.value && s.setMonth(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="월 선택"
              />
            </label>
            <button className="p-2 hover:bg-slate-100" onClick={() => s.setMonth(shiftMonth(s.month, 1))} aria-label="다음 달">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button
            className={btn.secondary}
            onClick={() => {
              s.setMonth(toMonth(new Date()));
              setSelectedDate(today());
            }}
          >
            오늘
          </button>
        </div>
        <button className={`${btn.primary} md:hidden`} onClick={() => setEventModal({ initial: null, preset: null })}>
          <Plus className="h-4 w-4" /> 새 일정
        </button>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${inputBase} w-full pl-9 sm:w-60`} placeholder="일정·담당자·장소 검색" value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
        </div>
      </div>

      {s.error ? (
        <ErrorState message={s.error} onRetry={s.reload} />
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* 왼쪽: 라벨 */}
          <aside className="hidden w-60 flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-200 bg-white p-4 md:flex">
            <button className={btn.primary} onClick={() => setEventModal({ initial: null, preset: null })}>
              <Plus className="h-4 w-4" /> 새 일정
            </button>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">라벨</h4>
                <button className="text-xs text-blue-600 hover:underline" onClick={() => setLabelModal({ initial: null })}>
                  + 라벨 추가
                </button>
              </div>
              <ul className="space-y-1">
                {s.labels.map((l) => (
                  <li key={l.id} className="group flex items-center gap-1">
                    <button
                      className={`flex flex-1 items-center gap-2 truncate rounded-md border px-2 py-1.5 text-left text-sm ${colorOf(l.color).chip}`}
                      onClick={() => setEventModal({ initial: null, preset: l })}
                      title={`${l.name} 일정 추가`}
                    >
                      <span>{l.emoji}</span>
                      <span className="flex-1 truncate">{l.name}</span>
                      <span className="text-xs opacity-60">{l.eventCount}</span>
                    </button>
                    <button className="rounded p-1 text-slate-400 opacity-0 hover:text-blue-600 group-hover:opacity-100" onClick={() => setLabelModal({ initial: l })} aria-label="라벨 수정">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button className="rounded p-1 text-slate-400 opacity-0 hover:text-red-600 group-hover:opacity-100" onClick={() => setDeletingLabel(l)} aria-label="라벨 삭제">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                {s.labels.length === 0 && <li className="text-xs text-slate-500">라벨이 없습니다.</li>}
              </ul>
            </div>
            <Link href="/coursemaker/" className={btn.secondary}>
              <Plus className="h-4 w-4" /> 코스 만들기
            </Link>
          </aside>

          {/* 가운데: 달력 */}
          <section aria-label="달력" className="min-w-0 flex-1 overflow-auto">
            {s.loading && s.events.length === 0 ? (
              <LoadingState />
            ) : (
              <MonthCalendar
                month={s.month}
                events={s.events}
                labelById={s.labelById}
                selectedDate={selectedDate}
                selectedEventId={detail?.id ?? null}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setSelectedEvent(null);
                }}
                onSelectEvent={(e) => {
                  setSelectedEvent(e);
                  setSelectedDate(e.startDate > selectedDate || e.endDate < selectedDate ? e.startDate : selectedDate);
                }}
              />
            )}
            <section className="border-t border-slate-200 bg-white p-4 lg:hidden">{sidePanel}</section>
          </section>

          {/* 오른쪽: 선택한 날짜 / 일정 상세 */}
          <aside className="hidden w-80 flex-shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4 lg:block">
            {sidePanel}
          </aside>
        </div>
      )}

      <EventFormModal
        open={!!eventModal}
        onClose={() => setEventModal(null)}
        initial={eventModal?.initial ?? null}
        presetLabel={eventModal?.preset ?? null}
        defaultDate={selectedDate}
        labels={s.labels}
        onSubmit={async (body) => {
          if (eventModal?.initial) {
            const updated = await s.updateEvent(eventModal.initial.id, body);
            setSelectedEvent(updated);
            toast.success("일정을 수정했습니다.");
          } else {
            await s.createEvent(body);
            toast.success("일정을 추가했습니다.");
          }
        }}
      />
      <LabelFormModal
        open={!!labelModal}
        onClose={() => setLabelModal(null)}
        initial={labelModal?.initial ?? null}
        onSubmit={async (body) => {
          await s.saveLabel(labelModal?.initial?.id ?? null, body);
          toast.success(labelModal?.initial ? "라벨을 수정했습니다." : "라벨을 추가했습니다.");
        }}
      />
      <DeleteLabelModal
        label={deletingLabel}
        labels={s.labels}
        onClose={() => setDeletingLabel(null)}
        onConfirm={async (reassignTo) => {
          await s.removeLabel(deletingLabel!.id, reassignTo);
          toast.success("라벨을 삭제했습니다.");
        }}
      />
    </div>
  );
}

function EventDetail({
  event,
  label,
  onBack,
  onEdit,
  onDelete,
}: {
  event: ScheduleEvent;
  label?: ScheduleLabel;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <button className="mb-3 text-xs text-blue-600 hover:underline" onClick={onBack}>
        ← 날짜 일정으로
      </button>
      <div className="rounded-lg border border-slate-200 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            {label && (
              <span className={`mb-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${colorOf(label.color).chip}`}>
                {label.emoji} {label.name}
              </span>
            )}
            <h4 className="font-semibold text-slate-900">{event.name}</h4>
          </div>
          <div className="flex gap-1">
            <button className="rounded p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600" onClick={onEdit} aria-label="수정">
              <Pencil className="h-4 w-4" />
            </button>
            <button className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={onDelete} aria-label="삭제">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <dl className="mt-3 space-y-1 text-sm text-slate-600">
          <div>
            기간: {event.startDate} ~ {event.endDate}
          </div>
          {event.manager && <div>담당: {event.manager}</div>}
          {event.tourId && (
            <div>
              <Link href="/tours/" className="text-blue-600 hover:underline">
                연결된 투어 보기
              </Link>
            </div>
          )}
        </dl>
        {event.items.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
            {event.items.map((it, i) => (
              <li key={i}>
                <span className="font-medium text-slate-800">{it.time}</span> <span className="text-slate-600">{it.place}</span>
              </li>
            ))}
          </ul>
        )}
        {event.note && <p className="mt-3 whitespace-pre-wrap border-t border-slate-100 pt-3 text-sm text-slate-600">{event.note}</p>}
      </div>
    </div>
  );
}
