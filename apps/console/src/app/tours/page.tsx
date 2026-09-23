"use client";

import { useState, useEffect, useMemo, MouseEvent } from "react";
import { Tour, fetchAllPlans } from "./tourApi";
import TourTable from "./components/TourTable";

export default function App() {
  const [managedTours, setManagedTours] = useState<Tour[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const uniqueTourTypes = useMemo(() => {
    const types = new Set(managedTours.map((tour) => tour.type));
    return Array.from(types).filter(Boolean) as string[];
  }, [managedTours]);

  // Load Material Icons
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Fetch tours
  useEffect(() => {
    const loadTours = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAllPlans();
        setManagedTours(
          data.map((item) => ({
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
          }))
        );
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadTours();
  }, []);

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

  const handleToggleDropdown = (
    tourId: number,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    if (openDropdownId === tourId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      setOpenDropdownId(tourId);
      const rect = event.currentTarget.getBoundingClientRect();
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
        if (newTop < rect.top) newTop = rect.top;
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
  };

  const handleStatusChange = (tourId: number, newStatus: string) => {
    setManagedTours((prev) =>
      prev.map((tour) =>
        tour.plan_id === tourId ? { ...tour, status: newStatus } : tour
      )
    );
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleSeatChange = (
    tourId: number,
    field: "capacity" | "bookedSeats",
    value: number
  ) => {
    setManagedTours((prev) =>
      prev.map((tour) =>
        tour.plan_id === tourId ? { ...tour, [field]: value } : tour
      )
    );
  };

  const handleViewAll = () => {
    setSearchKeyword("");
    setSelectedDate("");
    setSelectedType("");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans antialiased text-gray-800">
      {/* Filters bar */}
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

      {/* Tour management table */}
      <TourTable
        tours={filteredTours}
        isLoading={isLoading}
        error={error}
        openDropdownId={openDropdownId}
        dropdownPosition={dropdownPosition}
        onToggleDropdown={handleToggleDropdown}
        onStatusChange={handleStatusChange}
        onSeatChange={handleSeatChange}
      />

      {/* Create new tour button */}
      <div className="flex justify-start mt-4">
        <button
          onClick={() => (window.location.href = "/toolpage/coursemaker")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          + 새 투어 만들기
        </button>
      </div>
    </div>
  );
}
