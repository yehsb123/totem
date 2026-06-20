"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  Bell,
  MoreHorizontal,
  Plus,
  CalendarDays,
  Edit,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { Schedule, EventType } from "@/types/schedule";
import { EMOJI_LIST, COLOR_OPTIONS, DEFAULT_COLOR, DAY_NAMES } from "@/constants/schedule";
import { useScheduleData, formatDateToYYYYMMDD, getCalendarEventColorClass } from "./hooks/useScheduleData";

import NewEventModal from "./components/NewEventModal";
import EditEventModal from "./components/EditEventModal";
import EventTypeModal from "./components/EventTypeModal";
import SettingsModal from "./components/SettingsModal";
import LabelDetailModal from "./components/LabelDetailModal";
import EditLabelModal from "./components/EditLabelModal";

export default function SchedulePage() {
  const router = useRouter();
  const monthInputRef = useRef<HTMLInputElement>(null);

  const {
    today,
    currentCalendarDate,
    selectedDate,
    setSelectedDate,
    schedules,
    selectedScheduleDetail,
    isLoadingDetail,
    detailError,
    eventTypes,
    isLoadingEventTypes,
    eventTypesError,
    selectedLabelDetail,
    setSelectedLabelId,
    setSelectedLabelDetail,
    isLoadingLabelDetail,
    labelDetailError,
    searchQuery,
    setSearchQuery,
    getOngoingEventsForDate,
    handleCreateSchedule,
    handleUpdateSchedule,
    handleDeleteSchedule,
    handleCreateLabel,
    handleUpdateLabel,
    handleDeleteLabel,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    handleMonthInputChange,
    handleCourseClick,
    handleCalendarEventClick,
  } = useScheduleData();

  // ---- Modal states ----
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventInitial, setNewEventInitial] = useState({ name: "", place: "", manager: "" });

  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const [isNewEventTypeModalOpen, setIsNewEventTypeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLabelDetailModalOpen, setIsLabelDetailModalOpen] = useState(false);
  const [isEditLabelModalOpen, setIsEditLabelModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<EventType | null>(null);

  // ---- New event modal handlers ----
  const handleOpenNewEventModal = useCallback(
    (initialName = "", initialPlace = "", initialManager = "") => {
      setNewEventInitial({ name: initialName, place: initialPlace, manager: initialManager });
      setIsNewEventModalOpen(true);
    },
    []
  );

  const handleNewEventSubmit = useCallback(
    async (data: { name: string; startDate: string; endDate: string; place: string; manager: string; color: string }) => {
      try {
        await handleCreateSchedule(
          {
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            manager: data.manager,
            schedule: [{ time: "11:00", place: data.place }],
            typeId: 1,
            planId: 1,
          },
          data.color
        );
        setIsNewEventModalOpen(false);
      } catch (e) {
        alert(e instanceof Error ? `일정 생성 실패: ${e.message}` : "일정 생성 중 알 수 없는 오류가 발생했습니다.");
        console.error("Failed to create schedule:", e);
      }
    },
    [handleCreateSchedule]
  );

  // ---- Edit event modal handlers ----
  const handleOpenEditEventModal = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsEditEventModalOpen(true);
  }, []);

  const handleEditEventSubmit = useCallback(
    async (data: { name: string; startDate: string; endDate: string; place: string; manager: string; note: string; color: string }) => {
      if (!editingSchedule) return;
      try {
        await handleUpdateSchedule(
          editingSchedule.id,
          {
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            manager: data.manager,
            schedule: [{ time: editingSchedule.schedule?.[0]?.time || "11:00", place: data.place }],
            note: data.note,
            typeId: editingSchedule.typeId,
            planId: editingSchedule.planId,
          },
          data.color
        );
        setIsEditEventModalOpen(false);
        setEditingSchedule(null);
      } catch (e) {
        alert(e instanceof Error ? `일정 수정 실패: ${e.message}` : "일정 수정 중 알 수 없는 오류가 발생했습니다.");
        console.error("Failed to update schedule:", e);
      }
    },
    [editingSchedule, handleUpdateSchedule]
  );

  // ---- Event type modal handlers ----
  const handleEventTypeSubmit = useCallback(
    async (data: { name: string; emoji: string; color: string; defaultPlace: string; defaultManager: string }) => {
      try {
        await handleCreateLabel(data);
        setIsNewEventTypeModalOpen(false);
      } catch (e) {
        alert(e instanceof Error ? `일정 타입 추가 실패: ${e.message}` : "일정 타입 추가 중 알 수 없는 오류가 발생했습니다.");
        console.error("Failed to add event type:", e);
      }
    },
    [handleCreateLabel]
  );

  // ---- Label detail / edit handlers ----
  const handleOpenLabelDetail = useCallback(
    (label: EventType) => {
      setSelectedLabelId(label.id);
      setIsLabelDetailModalOpen(true);
    },
    [setSelectedLabelId]
  );

  const handleCloseLabelDetail = useCallback(() => {
    setSelectedLabelId(null);
    setSelectedLabelDetail(null);
    setIsLabelDetailModalOpen(false);
  }, [setSelectedLabelId, setSelectedLabelDetail]);

  const handleLabelDelete = useCallback(
    async (labelId: number) => {
      await handleDeleteLabel(labelId);
      setIsLabelDetailModalOpen(false);
      setIsEditLabelModalOpen(false);
    },
    [handleDeleteLabel]
  );

  const handleOpenEditLabel = useCallback((label: EventType) => {
    setEditingLabel(label);
    setIsEditLabelModalOpen(true);
  }, []);

  const handleEditLabelSubmit = useCallback(
    async (data: { name: string; emoji: string; color: string; defaultPlace: string; defaultManager: string }) => {
      if (!editingLabel) return;
      try {
        await handleUpdateLabel(editingLabel.id, data);
        setIsEditLabelModalOpen(false);
        setEditingLabel(null);
        handleCloseLabelDetail();
      } catch (e) {
        alert(e instanceof Error ? `라벨 수정 실패: ${e.message}` : "라벨 수정 중 알 수 없는 오류가 발생했습니다.");
        console.error("Failed to update label:", e);
      }
    },
    [editingLabel, handleUpdateLabel, handleCloseLabelDetail]
  );

  // ---- Calendar cells ----
  const calendarCells = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div key={`empty-prev-${i}`} className="p-2 border-r border-b border-gray-100 bg-gray-50 text-gray-400 min-h-[100px] h-full" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = formatDateToYYYYMMDD(dateObj);
      const dayEvents = getOngoingEventsForDate(dateStr);
      const isSelected = selectedDate === dateStr;
      const isToday = formatDateToYYYYMMDD(today) === dateStr;

      cells.push(
        <div
          key={dateStr}
          onClick={() => setSelectedDate(dateStr)}
          className={`
            relative p-2 text-sm cursor-pointer border-r border-b border-gray-100
            ${isToday ? "bg-red-100 text-red-700 font-semibold" : "bg-white text-gray-800"}
            ${isSelected ? "ring-2 ring-blue-500 z-10" : ""}
            min-h-[100px] flex flex-col justify-start items-start
            hover:bg-gray-100 transition-colors duration-150 ease-in-out group
          `}
        >
          <div className={`font-medium ${isToday ? "bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center -mt-0.5 -ml-0.5" : ""}`}>
            {day}
          </div>
          <div className="flex flex-col gap-1 w-full mt-1">
            {dayEvents.slice(0, 2).map((event, idx) => (
              <div
                key={event.id || idx}
                onClick={(e) => { e.stopPropagation(); handleCalendarEventClick(event.id); }}
                className={`${getCalendarEventColorClass(event.color)} text-white rounded-sm px-1 py-0.5 text-xs font-medium truncate`}
                title={event.name}
              >
                {event.name}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-600 mt-1">+{dayEvents.length - 2}개 더보기</div>
            )}
          </div>
        </div>
      );
    }

    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      cells.push(
        <div key={`empty-next-${i}`} className="p-2 border-r border-b border-gray-100 bg-gray-50 text-gray-400 min-h-[100px]" />
      );
    }

    return cells;
  }, [currentCalendarDate, selectedDate, today, getOngoingEventsForDate, handleCalendarEventClick, setSelectedDate]);

  const handleMonthSelectClick = () => {
    monthInputRef.current?.showPicker();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50" style={{ fontFamily: "sans-serif" }}>
      <input ref={monthInputRef} type="month" onChange={handleMonthInputChange} className="hidden" />

      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gray-300 rounded-md shadow-sm overflow-hidden bg-white">
            <button onClick={goToPrevMonth} className="p-2 bg-gray-50 hover:bg-gray-200 text-gray-600 transition-colors border-r border-gray-300" aria-label="이전 달">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleMonthSelectClick} className="w-48 flex items-center justify-between px-3 py-1.5 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors" aria-label="월 선택">
              <span>{currentCalendarDate.getFullYear()}년 {currentCalendarDate.getMonth() + 1}월</span>
              <CalendarDays className="w-5 h-5 text-gray-400" />
            </button>
            <button onClick={goToNextMonth} className="p-2 bg-gray-50 hover:bg-gray-200 text-gray-600 transition-colors border-l border-gray-300" aria-label="다음 달">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button onClick={goToToday} className="px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-300 shadow-sm">
            오늘
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-9 pr-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 rounded-md hover:bg-gray-100 transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <button onClick={() => handleOpenNewEventModal()} className="flex items-center justify-center w-full px-3 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors shadow">
              <Plus className="w-4 h-4 mr-2" />
              새로 만들기
            </button>
            <div className="pt-4 border-t border-gray-100 mt-6">
              <h4 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">코스 목록</h4>
              <ul className="text-sm list-none p-0">
                {schedules.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleCourseClick(item)}
                    className={`mb-1 p-2 rounded-md border truncate hover:opacity-80 transition-colors cursor-pointer ${item.color || DEFAULT_COLOR}`}
                    title={item.name}
                  >
                    • {item.name}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push("/toolpage/coursemaker")}
                className="mt-4 flex items-center w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                코스 추가
              </button>
            </div>
          </div>
        </aside>

        {/* Calendar */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="grid grid-cols-7 flex-shrink-0 border-b border-gray-200 bg-white">
            {DAY_NAMES.map((d, i) => (
              <div
                key={i}
                className={`font-semibold text-center text-xs py-2 border-r border-gray-100 last:border-r-0 ${
                  d === "일" ? "text-red-500" : d === "토" ? "text-blue-500" : "text-gray-700"
                }`}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 overflow-y-auto custom-scrollbar border-l border-gray-200">
            {calendarCells}
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="w-80 flex-shrink-0 bg-white border-l border-gray-200 p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <div className="pt-6 border-t border-gray-100 mt-6">
              <h4 className="text-base font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-gray-500" />
                <span>{selectedDate ? `${selectedDate} 일정` : "날짜를 선택하세요"}</span>
              </h4>
              {isLoadingDetail ? (
                <div className="text-center text-gray-500">상세 정보 불러오는 중...</div>
              ) : detailError ? (
                <div className="text-center text-red-500">오류: {detailError}</div>
              ) : selectedScheduleDetail ? (
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 relative">
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-gray-900 text-base font-semibold">{selectedScheduleDetail.name}</strong>
                    <div className="flex space-x-1">
                      <button onClick={() => handleOpenEditEventModal(selectedScheduleDetail)} className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50" title="일정 편집">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteSchedule(selectedScheduleDetail.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50" title="일정 삭제">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-1 text-xs">담당: {selectedScheduleDetail.manager}</p>
                  <p className="text-gray-500 text-xs mt-0.5">기간: {selectedScheduleDetail.startDate} ~ {selectedScheduleDetail.endDate}</p>
                  <ul className="mt-3 pl-4 list-disc text-gray-700 space-y-1">
                    {selectedScheduleDetail.schedule.map((s, idx) => (
                      <li key={idx} className="text-xs">
                        <span className="font-medium">{s.time}</span> {s.place}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500 mt-2 text-sm">일정을 클릭하여 상세 정보를 확인하세요.</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 mt-6">
                <h5 className="text-xs font-semibold uppercase text-gray-500 mb-2">새 일정 추가</h5>
                {isLoadingEventTypes ? (
                  <div className="text-sm text-center text-gray-500">라벨 불러오는 중...</div>
                ) : eventTypesError ? (
                  <div className="text-sm text-center text-red-500">라벨 로딩 실패: {eventTypesError}</div>
                ) : (
                  <ul className="text-sm text-gray-600 list-none p-0 space-y-2">
                    {eventTypes.map((type) => (
                      <li key={type.id}>
                        <button
                          onClick={() => handleOpenNewEventModal(type.name, type.defaultPlace || "", type.defaultManager || "")}
                          className={`w-full text-left flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${type.color} hover:opacity-80`}
                        >
                          <span className="mr-2 text-lg">{type.emoji}</span>
                          <span>{type.name} 추가</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 bg-white pt-4 pb-2 -mx-6 px-6 border-t border-gray-200">
            <button
              onClick={() => setIsNewEventTypeModalOpen(true)}
              className="flex items-center justify-center w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              일정 타입 추가
            </button>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <NewEventModal
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        onSubmit={handleNewEventSubmit}
        selectedDate={selectedDate}
        colorOptions={COLOR_OPTIONS}
        initialName={newEventInitial.name}
        initialPlace={newEventInitial.place}
        initialManager={newEventInitial.manager}
      />
      <EditEventModal
        isOpen={isEditEventModalOpen}
        onClose={() => { setIsEditEventModalOpen(false); setEditingSchedule(null); }}
        onSubmit={handleEditEventSubmit}
        schedule={editingSchedule}
        colorOptions={COLOR_OPTIONS}
      />
      <EventTypeModal
        isOpen={isNewEventTypeModalOpen}
        onClose={() => setIsNewEventTypeModalOpen(false)}
        onSubmit={handleEventTypeSubmit}
        emojiList={EMOJI_LIST}
        colorOptions={COLOR_OPTIONS}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      <LabelDetailModal
        isOpen={isLabelDetailModalOpen}
        onClose={handleCloseLabelDetail}
        label={selectedLabelDetail}
        isLoading={isLoadingLabelDetail}
        error={labelDetailError}
        onDelete={handleLabelDelete}
        onEdit={handleOpenEditLabel}
      />
      <EditLabelModal
        isOpen={isEditLabelModalOpen}
        onClose={() => { setIsEditLabelModalOpen(false); setEditingLabel(null); }}
        onSubmit={handleEditLabelSubmit}
        label={editingLabel}
        emojiList={EMOJI_LIST}
        colorOptions={COLOR_OPTIONS}
      />
    </div>
  );
}
