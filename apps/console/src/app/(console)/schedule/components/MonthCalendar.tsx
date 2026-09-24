"use client";

import type { ScheduleEvent, ScheduleLabel } from "@totem/shared";
import { addDays, parseLocalDate, today } from "@/lib/format";
import { colorOf } from "@/lib/labelColors";
import { visibleRange } from "../useSchedule";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"] as const;
const MAX_PER_CELL = 3;

export default function MonthCalendar({
  month,
  events,
  labelById,
  selectedDate,
  selectedEventId,
  onSelectDate,
  onSelectEvent,
}: {
  month: string;
  events: ScheduleEvent[];
  labelById: Map<string, ScheduleLabel>;
  selectedDate: string;
  selectedEventId: string | null;
  onSelectDate: (d: string) => void;
  onSelectEvent: (e: ScheduleEvent) => void;
}) {
  const { from } = visibleRange(month);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(from, i));
  const todayStr = today();
  const monthNum = Number(month.split("-")[1]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={`py-2 text-center text-xs font-semibold ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-600"}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {cells.map((date) => {
          const inMonth = parseLocalDate(date).getMonth() + 1 === monthNum;
          const dayEvents = events.filter((e) => e.startDate <= date && e.endDate >= date);
          const isToday = date === todayStr;
          const isSelected = date === selectedDate;
          return (
            <div
              key={date}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate(date)}
              onKeyDown={(e) => e.key === "Enter" && onSelectDate(date)}
              className={`min-h-[96px] cursor-pointer border-b border-r border-slate-100 p-1.5 text-sm transition-colors hover:bg-slate-50 ${
                inMonth ? "bg-white text-slate-800" : "bg-slate-50 text-slate-400"
              } ${isSelected ? "ring-2 ring-inset ring-blue-500" : ""}`}
            >
              <div
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday ? "bg-red-500 text-white" : ""
                }`}
              >
                {parseLocalDate(date).getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, MAX_PER_CELL).map((ev) => {
                  const label = ev.labelId ? labelById.get(ev.labelId) : undefined;
                  return (
                    <button
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      title={ev.name}
                      className={`truncate rounded px-1 py-0.5 text-left text-xs font-medium text-white ${colorOf(label?.color).bar} ${
                        selectedEventId === ev.id ? "ring-2 ring-slate-900/40" : ""
                      }`}
                    >
                      {label?.emoji} {ev.name}
                    </button>
                  );
                })}
                {dayEvents.length > MAX_PER_CELL && <span className="text-xs text-slate-500">+{dayEvents.length - MAX_PER_CELL}개 더</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
