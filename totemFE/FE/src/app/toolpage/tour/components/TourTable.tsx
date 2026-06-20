"use client";

import { MouseEvent } from "react";
import { Tour } from "../tourApi";
import StatusDropdown from "./StatusDropdown";

interface TourTableProps {
  tours: Tour[];
  isLoading: boolean;
  error: string | null;
  openDropdownId: number | null;
  dropdownPosition: { top: number; left: number; width: number } | null;
  onToggleDropdown: (
    tourId: number,
    event: MouseEvent<HTMLButtonElement>
  ) => void;
  onStatusChange: (tourId: number, newStatus: string) => void;
  onSeatChange: (
    tourId: number,
    field: "capacity" | "bookedSeats",
    value: number
  ) => void;
}

function calculateRemainingSeats(tour: Tour): number {
  return (tour.capacity || 0) - (tour.bookedSeats || 0);
}

export default function TourTable({
  tours,
  isLoading,
  error,
  openDropdownId,
  dropdownPosition,
  onToggleDropdown,
  onStatusChange,
  onSeatChange,
}: TourTableProps) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md mb-4">
      <table className="w-full bg-white border-collapse rounded-xl overflow-hidden shadow-sm">
        <thead>
          <tr className="bg-blue-50 h-12 text-gray-700">
            <th className="p-2 text-left">투어명</th>
            <th className="p-2 text-center">타입</th>
            <th className="p-2 text-center">기간</th>
            <th className="p-2 text-center">상태</th>
            <th className="p-2 text-center">담당자</th>
            <th className="p-2 text-center">예상 인원</th>
            <th className="p-2 text-center">예약 인원</th>
            <th className="p-2 text-center">잔여 좌석</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">
                투어 목록을 불러오는 중입니다...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={8} className="p-4 text-center text-red-500">
                오류: {error}
              </td>
            </tr>
          ) : tours.length > 0 ? (
            tours.map((tour) => {
              const remainingSeats = calculateRemainingSeats(tour);
              return (
                <tr
                  key={tour.plan_id}
                  className="text-center h-14 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="p-2 text-left text-gray-800">{tour.title}</td>
                  <td className="p-2 text-gray-700">{tour.nation}</td>
                  <td className="p-2 text-gray-700">{`${tour.startDate} ~ ${tour.endDate}`}</td>
                  <StatusDropdown
                    tourId={tour.plan_id}
                    currentStatus={tour.status || ""}
                    isOpen={openDropdownId === tour.plan_id}
                    dropdownPosition={
                      openDropdownId === tour.plan_id
                        ? dropdownPosition
                        : null
                    }
                    onToggle={onToggleDropdown}
                    onSelect={onStatusChange}
                  />
                  <td className="p-2 text-gray-700">{tour.note}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={tour.capacity || ""}
                      onChange={(e) =>
                        onSeatChange(
                          tour.plan_id,
                          "capacity",
                          Number(e.target.value)
                        )
                      }
                      className="w-24 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={tour.bookedSeats || ""}
                      onChange={(e) =>
                        onSeatChange(
                          tour.plan_id,
                          "bookedSeats",
                          Number(e.target.value)
                        )
                      }
                      className="w-24 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                    />
                  </td>
                  <td
                    className="p-2 font-bold"
                    style={{
                      color: remainingSeats <= 5 ? "#dc3545" : "#28a745",
                    }}
                  >
                    {remainingSeats}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">
                해당하는 투어가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
