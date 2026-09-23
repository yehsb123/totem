"use client";

import { MouseEvent, useRef } from "react";
import ReactDOM from "react-dom";

const STATUS_OPTIONS = ["Planned", "In_Progress", "Completed", "Canceled"];

const STATUS_LABELS: Record<string, string> = {
  Planned: "예정",
  In_Progress: "진행중",
  Completed: "종료",
  Canceled: "취소",
  "": "옵션 선택",
};

export function getStatusClasses(status: string): string {
  switch (status) {
    case "Planned":
      return "bg-green-600 text-white";
    case "In_Progress":
      return "bg-blue-600 text-white";
    case "Completed":
      return "bg-gray-500 text-white";
    case "Canceled":
      return "bg-red-600 text-white";
    case "":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-400 text-white";
  }
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || "옵션 선택";
}

interface StatusDropdownProps {
  tourId: number;
  currentStatus: string;
  isOpen: boolean;
  dropdownPosition: { top: number; left: number; width: number } | null;
  onToggle: (tourId: number, event: MouseEvent<HTMLButtonElement>) => void;
  onSelect: (tourId: number, newStatus: string) => void;
}

export default function StatusDropdown({
  tourId,
  currentStatus,
  isOpen,
  dropdownPosition,
  onToggle,
  onSelect,
}: StatusDropdownProps) {
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  return (
    <td className="p-2 relative">
      <button
        onClick={(e) => onToggle(tourId, e)}
        className={`rounded-md px-3 py-1 font-semibold border-none focus:outline-none cursor-pointer appearance-none text-center w-[100px] ${getStatusClasses(
          currentStatus
        )}`}
      >
        {getStatusLabel(currentStatus)}
        <span className="material-icons ml-1 text-sm">
          {isOpen ? "arrow_drop_up" : "arrow_drop_down"}
        </span>
      </button>

      {isOpen &&
        dropdownPosition &&
        ReactDOM.createPortal(
          <div
            ref={dropdownMenuRef}
            className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg w-[100px] max-h-40 overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `100px`,
            }}
          >
            {STATUS_OPTIONS.map((optionStatus) => (
              <button
                key={optionStatus}
                onClick={() => onSelect(tourId, optionStatus)}
                className={`block w-full text-left px-4 py-2 text-sm ${getStatusClasses(
                  optionStatus
                )} hover:opacity-80 transition duration-150 ease-in-out`}
              >
                {STATUS_LABELS[optionStatus]}
              </button>
            ))}
          </div>,
          document.body
        )}
    </td>
  );
}
