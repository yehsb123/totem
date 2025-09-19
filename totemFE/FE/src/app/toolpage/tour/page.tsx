"use client";

import { useState, useEffect, useRef, MouseEvent, useMemo } from "react";
import ReactDOM from "react-dom";

export interface Tour {
  plan_id: number;
  title: string;
  startDate: string;
  endDate: string;
  nation: string;
  age: number;
  gender: string;
  number: number;
  note: string;
  manager?: string;
  type?: string;
  capacity?: number;
  bookedSeats?: number;
  status?: string;
}

const API_BASE = "http://localhost:8000";
const getToken = () => "your_access_token";

async function fetchAllPlans(): Promise<Tour[]> {
  const response = await fetch(`${API_BASE}/api/plan/v1`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (response.status === 404) {
    throw new Error("회원 정보를 찾을 수 없습니다.");
  }
  if (!response.ok) {
    throw new Error("투어 목록을 불러오는 데 실패했습니다.");
  }

  const data = await response.json();
  return data;
}

export default function App() {
  const [managedTours, setManagedTours] = useState<Tour[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uniqueTourTypes = useMemo(() => {
    const types = new Set(managedTours.map((tour) => tour.type));
    return Array.from(types).filter(Boolean) as string[];
  }, [managedTours]);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const loadTours = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAllPlans();
        const mappedData: Tour[] = data.map((item) => ({
          ...item,
          id: item.plan_id,
          name: item.title,
          start: item.startDate,
          end: item.endDate,
          manager: item.note,
          type: item.nation,
          capacity: item.number,
          bookedSeats: 0,
          status: "Planned",
        }));
        setManagedTours(mappedData);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTours();
  }, []);

  const getStatusClasses = (status: string) => {
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
  };

  const handleStatusChange = (tourId: number, newStatus: string) => {
    setManagedTours((prevTours) =>
      prevTours.map((tour) =>
        tour.plan_id === tourId ? { ...tour, status: newStatus } : tour
      )
    );
  };

  const handleSeatChange = (
    tourId: number,
    field: "capacity" | "bookedSeats",
    value: number
  ) => {
    setManagedTours((prevTours) =>
      prevTours.map((tour) =>
        tour.plan_id === tourId ? { ...tour, [field]: value } : tour
      )
    );
  };

  const filteredTours = managedTours.filter((tour) => {
    const matchesName = searchKeyword
      ? tour.title.includes(searchKeyword)
      : true;

    let matchesDate = true;
    if (selectedDate) {
      matchesDate =
        tour.startDate <= selectedDate && tour.endDate >= selectedDate;
    }

    const matchesType = selectedType ? tour.type === selectedType : true;

    return matchesName && matchesDate && matchesType;
  });

  const handleCreateNewTour = () => {
    window.location.href = "/toolpage/coursemaker";
  };

  const handleViewAll = () => {
    setSearchKeyword("");
    setSelectedDate("");
    setSelectedType("");
  };

  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  const handleToggleDropdown = (
    tourId: number,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    if (openDropdownId === tourId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      setOpenDropdownId(tourId);
      const clickedButton = event.currentTarget;
      if (clickedButton) {
        const rect = clickedButton.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        const estimatedDropdownHeight = 160;
        const estimatedDropdownWidth = 100;

        let newTop = rect.bottom;
        let newLeft = rect.left;

        if (newTop + estimatedDropdownHeight > viewportHeight) {
          newTop = viewportHeight - estimatedDropdownHeight - 10;
          if (newTop < rect.top) {
            newTop = rect.top;
          }
        }

        if (newLeft + estimatedDropdownWidth > viewportWidth) {
          newLeft = viewportWidth - estimatedDropdownWidth - 10;
          if (newLeft < 10) newLeft = 10;
        }

        setDropdownPosition({
          top: newTop + scrollY,
          left: newLeft + scrollX,
          width: estimatedDropdownWidth,
        });
      }
    }
  };

  const statusOptions = ["Planned", "In_Progress", "Completed", "Canceled"];
  const statusLabels: { [key: string]: string } = {
    Planned: "예정",
    In_Progress: "진행중",
    Completed: "종료",
    Canceled: "취소",
    "": "옵션 선택",
  };

  const calculateRemainingSeats = (tour: Tour) => {
    return (tour.capacity || 0) - (tour.bookedSeats || 0);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans antialiased text-gray-800">
      <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex items-center gap-4">
        <div className="relative flex-grow max-w-md">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="투어명 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            data-placeholder="----년--월--일"
            className="h-10 w-64 px-4 pr-10 text-base text-gray-800 bg-white border border-gray-300 rounded-md shadow-sm outline-none appearance-none custom-date-input"
          />
          <div className="absolute top-0 right-0 h-full w-10 bg-gray-200 border-l border-gray-300 rounded-r-md flex items-center justify-center pointer-events-none">
            <span className="material-icons text-xl text-gray-600">event</span>
          </div>
        </div>

        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-10 w-32 px-4 pr-10 text-base text-gray-800 bg-white border border-gray-300 rounded-md shadow-sm outline-none appearance-none cursor-pointer"
          >
            <option value="">모든 타입</option>
            {uniqueTourTypes.map((typeid) => (
              <option key={typeid} value={typeid}>
                {typeid}
              </option>
            ))}
          </select>
          <div className="absolute top-0 right-0 h-full w-10 bg-gray-200 border-l border-gray-300 rounded-r-md flex items-center justify-center pointer-events-none">
            <span className="material-icons text-xl text-gray-600">
              arrow_drop_down
            </span>
          </div>
        </div>

        <button
          onClick={handleViewAll}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200"
        >
          전체보기
        </button>
      </div>

      <style jsx>{`
        .custom-date-input::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 1;
        }

        .custom-date-input:not([value]):before {
          content: attr(data-placeholder);
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: calc(100% - 2.5rem);
        }
      `}</style>

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
            ) : filteredTours.length > 0 ? (
              filteredTours.map((tour) => {
                const remainingSeats = calculateRemainingSeats(tour);
                return (
                  <tr
                    key={tour.plan_id}
                    className="text-center h-14 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="p-2 text-left text-gray-800">
                      {tour.title}
                    </td>
                    <td className="p-2 text-gray-700">{tour.nation}</td>
                    <td className="p-2 text-gray-700">{`${tour.startDate} ~ ${tour.endDate}`}</td>
                    <td className="p-2 relative">
                      <button
                        onClick={(e) => handleToggleDropdown(tour.plan_id, e)}
                        className={`rounded-md px-3 py-1 font-semibold border-none focus:outline-none cursor-pointer appearance-none text-center w-[100px] ${getStatusClasses(
                          tour.status || ""
                        )}`}
                      >
                        {statusLabels[tour.status || ""] || "옵션 선택"}
                        <span className="material-icons ml-1 text-sm">
                          {tour.plan_id === openDropdownId
                            ? "arrow_drop_up"
                            : "arrow_drop_down"}
                        </span>
                      </button>

                      {openDropdownId === tour.plan_id &&
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
                            {statusOptions.map((optionStatus) => (
                              <button
                                key={optionStatus}
                                onClick={() => {
                                  handleStatusChange(
                                    tour.plan_id,
                                    optionStatus
                                  );
                                  setOpenDropdownId(null);
                                  setDropdownPosition(null);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm ${getStatusClasses(
                                  optionStatus
                                )} hover:opacity-80 transition duration-150 ease-in-out`}
                              >
                                {statusLabels[optionStatus]}
                              </button>
                            ))}
                          </div>,
                          document.body
                        )}
                    </td>
                    <td className="p-2 text-gray-700">{tour.note}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={tour.capacity || ""}
                        onChange={(e) =>
                          handleSeatChange(
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
                          handleSeatChange(
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

      <div className="flex justify-start mt-4">
        <button
          onClick={handleCreateNewTour}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          + 새 투어 만들기
        </button>
      </div>
    </div>
  );
}
