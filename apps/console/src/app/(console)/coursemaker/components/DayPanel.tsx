"use client";

import { X } from "lucide-react";
import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { PLACE_CATEGORY_LABELS, type CoursePlace } from "@totem/shared";
import { DND, HOTEL_SLOT_INDEX, type DragPlace, type DragSlot, type EditorDay } from "../courseModel";
import RouteSummary from "./RouteSummary";

function Slot({
  index,
  label,
  place,
  onDropPlace,
  onMove,
  onRemove,
}: {
  index: number;
  label: string;
  place: CoursePlace | null;
  onDropPlace: (slotIndex: number, place: CoursePlace) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (slotIndex: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // 놓았을 때 한 번만 반영 (구 코드는 hover 마다 자리를 바꿔 끌기 도중 순서가 뒤섞였다)
  const [{ isOver, canDrop }, drop] = useDrop<DragPlace | DragSlot, unknown, { isOver: boolean; canDrop: boolean }>(
    () => ({
      accept: [DND.PLACE, DND.SLOT],
      drop: (item) => (item.kind === DND.PLACE ? onDropPlace(index, item.place) : onMove(item.fromIndex, index)),
      collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
    }),
    [index, onDropPlace, onMove],
  );
  const [{ isDragging }, drag] = useDrag<DragSlot, unknown, { isDragging: boolean }>(
    () => ({ type: DND.SLOT, item: { kind: DND.SLOT, fromIndex: index }, canDrag: !!place, collect: (m) => ({ isDragging: m.isDragging() }) }),
    [index, place],
  );
  drag(drop(ref));
  const isHotelSlot = index === HOTEL_SLOT_INDEX;

  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-500">{label}</div>
      <div
        ref={ref}
        className={`flex min-h-[56px] items-center rounded-lg border-2 px-3 py-2 transition-colors ${
          place ? "cursor-move border-solid border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"
        } ${isOver && canDrop ? "border-blue-400 bg-blue-50" : ""} ${isDragging ? "opacity-40" : ""}`}
      >
        {place ? (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-800">{place.title}</div>
              <div className="truncate text-xs text-slate-500">
                {PLACE_CATEGORY_LABELS[place.category]} · {place.addr1}
              </div>
            </div>
            <button onClick={() => onRemove(index)} className="ml-2 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="빼기">
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <span className="w-full text-center text-xs text-slate-400">{isHotelSlot ? "숙소를 끌어다 놓으세요" : "장소를 끌어다 놓으세요"}</span>
        )}
      </div>
    </div>
  );
}

export default function DayPanel({
  day,
  dayIndex,
  dayCount,
  timeSlots,
  onPrev,
  onNext,
  onDropPlace,
  onMove,
  onRemove,
  onRoute,
  className = "",
}: {
  className?: string;
  onRoute: (path: [number, number][] | null) => void;
  day: EditorDay | null;
  dayIndex: number;
  dayCount: number;
  timeSlots: string[];
  onPrev: () => void;
  onNext: () => void;
  onDropPlace: (slotIndex: number, place: CoursePlace) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (slotIndex: number) => void;
}) {
  return (
    <aside className={`w-full flex-shrink-0 flex-col bg-white p-4 lg:w-[320px] ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">{day ? `${dayIndex + 1}일차 · ${day.date}` : "기간을 선택하세요"}</h3>
        {dayCount > 1 && (
          <div className="flex gap-1">
            <button className="rounded-md bg-slate-100 px-2.5 py-1 text-xs hover:bg-slate-200 disabled:opacity-40" onClick={onPrev} disabled={dayIndex === 0}>
              이전
            </button>
            <button className="rounded-md bg-slate-100 px-2.5 py-1 text-xs hover:bg-slate-200 disabled:opacity-40" onClick={onNext} disabled={dayIndex >= dayCount - 1}>
              다음
            </button>
          </div>
        )}
      </div>
      {day && <RouteSummary day={day} onRoute={onRoute} />}
      {day && (
        <div className="-mr-2 flex-1 space-y-2 overflow-y-auto pr-2">
          {timeSlots.map((label, i) => (
            <Slot key={`${day.date}-${i}`} index={i} label={label} place={day.slots[i] ?? null} onDropPlace={onDropPlace} onMove={onMove} onRemove={onRemove} />
          ))}
        </div>
      )}
    </aside>
  );
}
