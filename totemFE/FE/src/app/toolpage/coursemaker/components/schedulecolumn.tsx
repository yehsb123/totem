"use client";

import React, { useRef } from "react";
import { useDrop, useDrag } from "react-dnd";
import { TourPlace } from "../tourapidata";
import { ItemTypes } from "../types";
// import { deletePlanDetail } from "../api/planapi"; // deletePlanDetail API 함수 임포트 (사용하지 않음)

// 스케줄 내에서 드래그 가능한 개별 장소 아이템 컴포넌트
interface ScheduleItemProps {
  place: TourPlace;
  index: number;
  onMovePlace: (dragIndex: number, hoverIndex: number) => void;
  onRemovePlace: (slotIndex: number) => void;
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({
  place,
  index,
  onMovePlace,
  onRemovePlace,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // 드래그 기능 구현
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SCHEDULED_PLACE,
    item: { id: place.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // 드롭 기능 구현
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.SCHEDULED_PLACE,
    hover(item: { id: string; index: number }) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      onMovePlace(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`relative p-3 bg-white rounded-md shadow-sm border border-gray-200 cursor-move transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${isOver ? "bg-gray-100" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold text-sm text-gray-800">
            {place.title}
          </div>
          <div className="text-xs text-gray-500">{place.addr1}</div>
        </div>
        <button
          onClick={() => onRemovePlace(index)}
          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// 드롭 영역 컴포넌트
interface ScheduleDropSlotProps {
  slotIndex: number;
  place: TourPlace | null;
  onDrop: (slotIndex: number, droppedPlace: TourPlace) => void;
  hotelSlotIndex: number;
}

const ScheduleDropSlot: React.FC<ScheduleDropSlotProps> = ({
  slotIndex,
  place,
  onDrop,
  hotelSlotIndex,
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.TOUR_PLACE, ItemTypes.SCHEDULED_PLACE],
    drop: (item: TourPlace) => onDrop(slotIndex, item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      className={`p-3 border-2 border-dashed rounded-lg mb-2 min-h-[80px] flex items-center justify-center transition-colors ${
        isOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"
      }`}
    >
      {place ? null : ( // `ScheduleItem`은 `ScheduleColumn`에서 직접 렌더링되므로, 이 부분은 비워둡니다.
        <div className="text-gray-400 text-sm">
          {slotIndex === hotelSlotIndex ? "숙소 추가" : "장소 추가"}
        </div>
      )}
    </div>
  );
};

// 전체 스케줄 컬럼 컴포넌트
interface ScheduleColumnProps {
  schedule: (TourPlace | null)[];
  timeSlots: string[];
  onDrop: (slotIndex: number, droppedPlace: TourPlace) => void;
  onMovePlace: (dragIndex: number, hoverIndex: number) => void;
  onRemovePlace: (slotIndex: number) => void;
  hotelSlotIndex: number;
}

const ScheduleColumn: React.FC<ScheduleColumnProps> = ({
  schedule,
  timeSlots,
  onDrop,
  onMovePlace,
  onRemovePlace,
  hotelSlotIndex,
}) => {
  return (
    <div className="w-full">
      <div className="text-center font-semibold text-gray-700 mb-4">
        시간별 스케줄
      </div>
      <div className="space-y-2">
        {timeSlots.map((timeSlot, index) => (
          <div key={index} className="mb-4">
            <div className="text-sm font-medium text-gray-600 mb-2">
              {timeSlot}
            </div>
            {schedule[index] ? (
              <ScheduleItem
                place={schedule[index] as TourPlace}
                index={index}
                onMovePlace={onMovePlace}
                onRemovePlace={onRemovePlace}
              />
            ) : (
              <ScheduleDropSlot
                slotIndex={index}
                place={null}
                onDrop={onDrop}
                hotelSlotIndex={hotelSlotIndex}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleColumn;
