"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Schedule, ScheduleRequestBody, ScheduleUpdateBody, EventType } from "@/types/schedule";
import { DEFAULT_COLOR } from "@/constants/schedule";
import * as api from "../scheduleApi";

export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getCalendarEventColorClass = (tourColor: string | undefined): string => {
  if (!tourColor) return "bg-gray-500";
  const bgClassMatch = tourColor.match(/bg-([a-z]+)-(\d+)/);
  if (bgClassMatch && bgClassMatch[1]) {
    return `bg-${bgClassMatch[1]}-500`;
  }
  return "bg-gray-500";
};

export function useScheduleData() {
  const [today] = useState<Date>(new Date());
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateToYYYYMMDD(new Date()));

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<Schedule | null>(null);
  const [isLoadingDetail] = useState(false);
  const [detailError] = useState<string | null>(null);

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [isLoadingEventTypes, setIsLoadingEventTypes] = useState(false);
  const [eventTypesError, setEventTypesError] = useState<string | null>(null);

  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
  const [selectedLabelDetail, setSelectedLabelDetail] = useState<EventType | null>(null);
  const [isLoadingLabelDetail, setIsLoadingLabelDetail] = useState(false);
  const [labelDetailError, setLabelDetailError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  // ---- Fetch event types (labels) ----
  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        setIsLoadingEventTypes(true);
        const data = await api.getLabels();
        setEventTypes(data);
        setEventTypesError(null);
      } catch (e) {
        setEventTypesError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
        console.error("Failed to fetch event types:", e);
      } finally {
        setIsLoadingEventTypes(false);
      }
    };
    fetchEventTypes();
  }, []);

  // ---- Fetch schedules (depends on eventTypes) ----
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setIsLoading(true);
        const data = await api.getSchedules();
        const schedulesWithColors = data.map((schedule) => {
          const eventType = eventTypes.find((type) => type.id === schedule.typeId);
          return { ...schedule, color: eventType ? eventType.color : DEFAULT_COLOR };
        });
        setSchedules(schedulesWithColors);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
        console.error("Failed to fetch schedules:", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventTypes.length > 0) {
      fetchSchedules();
    }
  }, [eventTypes]);

  // ---- Fetch label detail ----
  useEffect(() => {
    if (selectedLabelId === null) {
      setSelectedLabelDetail(null);
      return;
    }
    const fetchLabelDetail = async () => {
      try {
        setIsLoadingLabelDetail(true);
        const data = await api.getLabelDetail(selectedLabelId);
        setSelectedLabelDetail(data);
        setLabelDetailError(null);
      } catch (e) {
        setLabelDetailError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
        console.error("Failed to fetch label detail:", e);
      } finally {
        setIsLoadingLabelDetail(false);
      }
    };
    fetchLabelDetail();
  }, [selectedLabelId]);

  // ---- Filtered events ----
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return schedules;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return schedules.filter(
      (schedule) =>
        schedule.name.toLowerCase().includes(lowerCaseQuery) ||
        schedule.manager.toLowerCase().includes(lowerCaseQuery) ||
        schedule.schedule.some((s) => s.place.toLowerCase().includes(lowerCaseQuery))
    );
  }, [schedules, searchQuery]);

  const events = useMemo(() => {
    return filteredEvents.map((schedule) => ({ ...schedule }));
  }, [filteredEvents]);

  // ---- Events for date ----
  const getOngoingEventsForDate = useCallback(
    (dateStr: string) => {
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      return events.filter((schedule) => {
        const startDateObj = new Date(schedule.startDate);
        const endDateObj = new Date(schedule.endDate);
        startDateObj.setHours(0, 0, 0, 0);
        endDateObj.setHours(0, 0, 0, 0);
        return targetDate >= startDateObj && targetDate <= endDateObj;
      });
    },
    [events]
  );

  // ---- CRUD: Schedule ----
  const handleCreateSchedule = useCallback(
    async (body: ScheduleRequestBody, color: string) => {
      const newSchedule = await api.createSchedule(body);
      const scheduleWithColor = { ...newSchedule, color };
      setSchedules((prev) => [...prev, scheduleWithColor]);
      return scheduleWithColor;
    },
    []
  );

  const handleUpdateSchedule = useCallback(
    async (id: number, body: ScheduleUpdateBody, color: string) => {
      const updatedSchedule = await api.updateSchedule(id, body);
      const updatedWithColor = { ...updatedSchedule, color };
      setSchedules((prev) => prev.map((s) => (s.id === updatedWithColor.id ? updatedWithColor : s)));
      setSelectedScheduleDetail(updatedWithColor);
      return updatedWithColor;
    },
    []
  );

  const handleDeleteSchedule = useCallback(async (scheduleId: number) => {
    if (!confirm("정말로 이 일정을 삭제하시겠습니까?")) return;
    try {
      const data = await api.deleteSchedule(scheduleId);
      alert(data.message || "일정이 성공적으로 삭제되었습니다.");
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      setSelectedScheduleId(null);
      setSelectedScheduleDetail(null);
    } catch (e) {
      alert(e instanceof Error ? `일정 삭제 실패: ${e.message}` : "일정 삭제 중 알 수 없는 오류가 발생했습니다.");
      console.error("Failed to delete schedule:", e);
    }
  }, []);

  // ---- CRUD: Label ----
  const handleCreateLabel = useCallback(async (body: Omit<EventType, "id">) => {
    const addedEventType = await api.createLabel(body);
    setEventTypes((prev) => [...prev, addedEventType]);
    return addedEventType;
  }, []);

  const handleUpdateLabel = useCallback(async (id: number, body: Omit<EventType, "id">) => {
    const updatedLabel = await api.updateLabel(id, body);
    setEventTypes((prev) => prev.map((type) => (type.id === updatedLabel.id ? updatedLabel : type)));
    return updatedLabel;
  }, []);

  const handleDeleteLabel = useCallback(async (labelId: number) => {
    if (!confirm("정말로 이 라벨을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
      const data = await api.deleteLabel(labelId);
      alert(data.message || "라벨이 성공적으로 삭제되었습니다.");
      setEventTypes((prev) => prev.filter((type) => type.id !== labelId));
      setSelectedLabelId(null);
      setSelectedLabelDetail(null);
    } catch (e) {
      alert(e instanceof Error ? `라벨 삭제 실패: ${e.message}` : "라벨 삭제 중 알 수 없는 오류가 발생했습니다.");
      console.error("Failed to delete label:", e);
    }
  }, []);

  // ---- Calendar navigation ----
  const goToPrevMonth = useCallback(() => {
    setCurrentCalendarDate(
      new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1)
    );
    setSelectedDate(null);
  }, [currentCalendarDate]);

  const goToNextMonth = useCallback(() => {
    setCurrentCalendarDate(
      new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1)
    );
    setSelectedDate(null);
  }, [currentCalendarDate]);

  const goToToday = useCallback(() => {
    setCurrentCalendarDate(today);
    setSelectedDate(formatDateToYYYYMMDD(today));
  }, [today]);

  const handleMonthInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const [year, month] = value.split("-").map(Number);
      setCurrentCalendarDate(new Date(year, month - 1, 1));
      setSelectedDate(null);
    }
  }, []);

  // ---- Course click ----
  const handleCourseClick = useCallback((schedule: Schedule) => {
    const startDate = new Date(schedule.startDate);
    setCurrentCalendarDate(startDate);
    setSelectedDate(schedule.startDate);
    setSelectedScheduleId(schedule.id);
  }, []);

  const handleCalendarEventClick = useCallback((scheduleId: number) => {
    setSelectedScheduleId(scheduleId);
  }, []);

  return {
    // State
    today,
    currentCalendarDate,
    selectedDate,
    setSelectedDate,
    schedules,
    isLoading,
    error,
    selectedScheduleId,
    selectedScheduleDetail,
    setSelectedScheduleDetail,
    isLoadingDetail,
    detailError,
    eventTypes,
    isLoadingEventTypes,
    eventTypesError,
    selectedLabelId,
    setSelectedLabelId,
    selectedLabelDetail,
    setSelectedLabelDetail,
    isLoadingLabelDetail,
    labelDetailError,
    searchQuery,
    setSearchQuery,
    events,

    // Derived
    getOngoingEventsForDate,

    // CRUD Schedule
    handleCreateSchedule,
    handleUpdateSchedule,
    handleDeleteSchedule,

    // CRUD Label
    handleCreateLabel,
    handleUpdateLabel,
    handleDeleteLabel,

    // Calendar nav
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    handleMonthInputChange,

    // Clicks
    handleCourseClick,
    handleCalendarEventClick,
  };
}
