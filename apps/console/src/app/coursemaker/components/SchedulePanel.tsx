"use client";

import React from "react";
import ScheduleColumn from "./schedulecolumn";
import { TourPlace } from "../tourapidata";
import { DaySchedule } from "../types";
import { TIME_SLOTS, HOTEL_SLOT_INDEX } from "../hooks/useCourseState";

interface SchedulePanelProps {
  currentSchedule: DaySchedule;
  currentDayIndex: number;
  schedulesLength: number;
  onDropPlace: (slotIndex: number, droppedPlace: TourPlace) => void;
  onMovePlace: (dragIndex: number, hoverIndex: number) => void;
  onRemovePlace: (slotIndex: number) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
}

const SchedulePanel: React.FC<SchedulePanelProps> = ({
  currentSchedule,
  currentDayIndex,
  schedulesLength,
  onDropPlace,
  onMovePlace,
  onRemovePlace,
  onPrevDay,
  onNextDay,
}) => {
  return (
    <aside className="w-[320px] flex-shrink-0 bg-white p-4 flex flex-col shadow-inner">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          {currentSchedule.date
            ? `${currentSchedule.date} (${currentDayIndex + 1}일차)`
            : "날짜를 선택하여 코스를 생성하세요"}
        </h3>
        <div className="flex gap-2">
          {schedulesLength > 1 && (
            <button
              onClick={onPrevDay}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors duration-200"
            >
              이전 일차
            </button>
          )}
          {schedulesLength > 1 && (
            <button
              onClick={onNextDay}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors duration-200"
            >
              다음 일차
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <ScheduleColumn
          schedule={currentSchedule.slots}
          timeSlots={TIME_SLOTS}
          onDrop={onDropPlace}
          onMovePlace={onMovePlace}
          onRemovePlace={onRemovePlace}
          hotelSlotIndex={HOTEL_SLOT_INDEX}
        />
      </div>
    </aside>
  );
};

export default SchedulePanel;
