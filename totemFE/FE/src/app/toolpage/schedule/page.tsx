"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  Bell,
  MoreHorizontal,
  Plus,
  CalendarDays,
  X,
  Smile,
  Trash2,
  Edit,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Schedule {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  manager: string;
  schedule: { time: string; place: string }[];
  typeId: number;
  planId: number;
  color?: string;
}

interface ScheduleRequestBody {
  name: string;
  startDate: string;
  endDate: string;
  manager: string;
  schedule: { time: string; place: string }[];
  typeId: number;
  planId: number;
}

interface ScheduleUpdateBody {
  name: string;
  startDate: string;
  endDate: string;
  manager: string;
  schedule: { time: string; place: string }[];
  note: string;
  typeId: number;
  planId: number;
}

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface EventType {
  id: number;
  name: string;
  emoji: string;
  color: string;
  defaultPlace?: string;
  defaultManager?: string;
}

const getCalendarEventColorClass = (tourColor: string | undefined): string => {
  if (!tourColor) return "bg-gray-500";
  const bgClassMatch = tourColor.match(/bg-([a-z]+)-(\d+)/);
  if (bgClassMatch && bgClassMatch[1]) {
    return `bg-${bgClassMatch[1]}-500`;
  }
  return "bg-gray-500";
};

export default function SchedulePage() {
  const [today] = useState<Date>(new Date());
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(
    new Date()
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    formatDateToYYYYMMDD(new Date())
  );
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const [, setSelectedScheduleId] = useState<number | null>(null);
  const [selectedScheduleDetail, setSelectedScheduleDetail] =
    useState<Schedule | null>(null);
  const [isLoadingDetail] = useState(false);
  const [detailError] = useState<string | null>(null);

  const [editEventNote, setEditEventNote] = useState("");

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [isLoadingEventTypes, setIsLoadingEventTypes] = useState(false);
  const [eventTypesError, setEventTypesError] = useState<string | null>(null);

  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
  const [selectedLabelDetail, setSelectedLabelDetail] =
    useState<EventType | null>(null);
  const [isLoadingLabelDetail, setIsLoadingLabelDetail] = useState(false);
  const [labelDetailError, setLabelDetailError] = useState<string | null>(null);

  // 라벨 수정 관련 상태와 ref는 맨 위에 선언되어야 합니다.
  const [isEditLabelModalOpen, setIsEditLabelModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<EventType | null>(null);
  const [editLabelName, setEditLabelName] = useState("");
  const [editLabelEmoji, setEditLabelEmoji] = useState("");
  const [editLabelColor, setEditLabelColor] = useState("");
  const [editLabelDefaultPlace, setEditLabelDefaultPlace] = useState("");
  const [editLabelDefaultManager, setEditLabelDefaultManager] = useState("");
  const editLabelModalRef = useRef<HTMLDialogElement>(null);

  const [isLabelDetailModalOpen, setIsLabelDetailModalOpen] = useState(false);
  const labelDetailModalRef = useRef<HTMLDialogElement>(null);

  const emojiList = [
    "😀",
    "😁",
    "😂",
    "🤣",
    "😃",
    "😄",
    "😅",
    "😆",
    "😉",
    "😊",
    "😋",
    "😎",
    "🤩",
    "🤔",
    "🫡",
    "🤫",
    "🫣",
    "🤫",
    "🤨",
    "😐",
    "😑",
    "😶",
    "🫠",
    "😏",
    "😩",
    "😫",
    "😮‍💨",
    "😓",
    "😔",
    "😥",
    "😢",
    "😭",
    "😮",
    "😲",
    "😳",
    "🤯",
    "😡",
    "😠",
    "🤬",
    "🥺",
    "🥹",
    "😩",
    "😫",
    "😤",
    "😠",
    "😡",
    "🤬",
    "🗣️",
    "💬",
    "👥",
    "🚀",
    "🧑‍💻",
    "📝",
    "🎉",
    "✈️",
    "🌴",
    "🏖️",
    "🏠",
    "🏡",
    "🏥",
    "🏢",
    "🏫",
    "🏭",
    "🏦",
    "🏛️",
    "🧱",
    "🪨",
    "🗻",
    "🏔️",
    "🏞️",
  ];

  // handleCloseLabelDetailModal 함수를 먼저 선언
  const handleCloseLabelDetailModal = useCallback(() => {
    setSelectedLabelId(null);
    setSelectedLabelDetail(null);
    setIsLabelDetailModalOpen(false);
    if (labelDetailModalRef.current) {
      labelDetailModalRef.current.close();
    }
  }, []);

  // handleOpenLabelDetailModal는 사용되지 않아 제거했습니다.

  const handleCloseEditLabelModal = useCallback(() => {
    setIsEditLabelModalOpen(false);
    if (editLabelModalRef.current) {
      editLabelModalRef.current.close();
    }
    setEditingLabel(null);
  }, []);

  // 라벨 삭제 API를 연동하는 함수
  const handleDeleteLabel = useCallback(
    async (labelId: number) => {
      if (
        !confirm(
          "정말로 이 라벨을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        )
      ) {
        return;
      }

      try {
        const accessToken = "your_access_token_here";
        const response = await fetch(
          `https://api.totembe.shop/api/scheduler/labels/${labelId}/v1`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.message || "라벨 삭제에 실패했습니다.");
        }
        if (!response.ok) {
          throw new Error("라벨 삭제에 실패했습니다.");
        }

        const data = await response.json();
        alert(data.message || "라벨이 성공적으로 삭제되었습니다.");

        setEventTypes((prevTypes) =>
          prevTypes.filter((type) => type.id !== labelId)
        );

        setSelectedLabelId(null);
        setSelectedLabelDetail(null);
        handleCloseEditLabelModal();
        handleCloseLabelDetailModal();
      } catch (e) {
        if (e instanceof Error) {
          alert(`라벨 삭제 실패: ${e.message}`);
        } else {
          alert("라벨 삭제 중 알 수 없는 오류가 발생했습니다.");
        }
        console.error("Failed to delete label:", e);
      }
    },
    [handleCloseEditLabelModal, handleCloseLabelDetailModal]
  );

  // 라벨 수정 API를 연동하는 함수
  const handleUpdateLabel = useCallback(async () => {
    if (!editingLabel) return;
    if (!editLabelName || !editLabelEmoji || !editLabelColor) {
      alert("이름, 이모티콘, 색상을 입력해주세요.");
      return;
    }

    try {
      const accessToken = "your_access_token_here";
      const response = await fetch(
        `https://api.totembe.shop/api/scheduler/labels/${editingLabel.id}/v1`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: editLabelName,
            emoji: editLabelEmoji,
            color: editLabelColor,
            defaultPlace: editLabelDefaultPlace,
            defaultManager: editLabelDefaultManager,
          }),
        }
      );

      if (response.status === 404) {
        const errorData = await response.json();
        throw new Error(errorData.message || "라벨 업데이트에 실패했습니다.");
      }
      if (!response.ok) {
        throw new Error("라벨 업데이트에 실패했습니다.");
      }

      const updatedLabel: EventType = await response.json();
      setEventTypes((prevTypes) =>
        prevTypes.map((type) =>
          type.id === updatedLabel.id ? updatedLabel : type
        )
      );
      handleCloseEditLabelModal();
    } catch (e) {
      if (e instanceof Error) {
        alert(`라벨 수정 실패: ${e.message}`);
      } else {
        alert("라벨 수정 중 알 수 없는 오류가 발생했습니다.");
      }
      console.error("Failed to update label:", e);
    }
  }, [
    editingLabel,
    editLabelName,
    editLabelEmoji,
    editLabelColor,
    editLabelDefaultPlace,
    editLabelDefaultManager,
    handleCloseEditLabelModal,
  ]);

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        setIsLoadingEventTypes(true);
        const accessToken = "your_access_token_here";
        const response = await fetch(
          "https://api.totembe.shop/api/scheduler/labels/v1",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "라벨을 불러오는 데 실패했습니다."
          );
        }

        const data: EventType[] = await response.json();
        setEventTypes(data);
        setEventTypesError(null);
      } catch (e) {
        if (e instanceof Error) {
          setEventTypesError(e.message);
        } else {
          setEventTypesError("알 수 없는 오류가 발생했습니다.");
        }
        console.error("Failed to fetch event types:", e);
      } finally {
        setIsLoadingEventTypes(false);
      }
    };

    fetchEventTypes();
  }, []);

  useEffect(() => {
    if (selectedLabelId === null) {
      setSelectedLabelDetail(null);
      return;
    }

    const fetchLabelDetail = async () => {
      try {
        setIsLoadingLabelDetail(true);
        const accessToken = "your_access_token_here";
        const response = await fetch(
          `https://api.totembe.shop/api/scheduler/labels/${selectedLabelId}/v1`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "라벨 상세 정보를 불러오는 데 실패했습니다."
          );
        }

        const data: EventType = await response.json();
        setSelectedLabelDetail(data);
        setLabelDetailError(null);
      } catch (e) {
        if (e instanceof Error) {
          setLabelDetailError(e.message);
        } else {
          setLabelDetailError("알 수 없는 오류가 발생했습니다.");
        }
        console.error("Failed to fetch label detail:", e);
      } finally {
        setIsLoadingLabelDetail(false);
      }
    };

    fetchLabelDetail();
  }, [selectedLabelId]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setIsLoading(true);
        const accessToken = "your_access_token_here";
        const response = await fetch(
          "https://api.totembe.shop/api/scheduler/v1",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.message || "회원 정보를 찾을 수 없습니다.");
        }
        if (!response.ok) {
          throw new Error("일정을 불러오는 데 실패했습니다.");
        }

        const data: Schedule[] = await response.json();
        const schedulesWithColors = data.map((schedule) => {
          const eventType = eventTypes.find(
            (type) => type.id === schedule.typeId
          );
          return {
            ...schedule,
            color: eventType
              ? eventType.color
              : "bg-gray-100 text-gray-800 border-gray-200",
          };
        });
        setSchedules(schedulesWithColors);
        setError(null);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
        console.error("Failed to fetch schedules:", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventTypes.length > 0) {
      fetchSchedules();
    }
  }, [eventTypes]);

  // 이전에 오류를 발생시켰던 초기 상태 설정 useEffect는 제거되었습니다.
  // const todayDate = new Date();
  // setToday(todayDate);
  // setCurrentCalendarDate(todayDate);
  // setSelectedDate(formatDateToYYYYMMDD(todayDate));
  // 대신 useState의 초기값으로 new Date()를 사용합니다.

  const monthInputRef = useRef<HTMLInputElement>(null);

  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventEndDate, setNewEventEndDate] = useState("");
  const [newEventPlace, setNewEventPlace] = useState("");
  const [newEventManager, setNewEventManager] = useState("");
  const [newEventColor, setNewEventColor] = useState(
    "bg-gray-100 text-gray-800 border-gray-200"
  );
  const newEventModalRef = useRef<HTMLDialogElement>(null);

  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editEventName, setEditEventName] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventEndDate, setEditEventEndDate] = useState("");
  const [editEventPlace, setEditEventPlace] = useState("");
  const [editEventManager, setEditEventManager] = useState("");
  const [editEventColor, setEditEventColor] = useState("");
  const editEventModalRef = useRef<HTMLDialogElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const settingsModalRef = useRef<HTMLDialogElement>(null);

  const [isNewEventTypeModalOpen, setIsNewEventTypeModalOpen] = useState(false);
  const [newEventType, setNewEventType] = useState<Omit<EventType, "id">>({
    name: "",
    emoji: "",
    color: "bg-gray-100 border-gray-200 text-gray-700",
    defaultPlace: "",
    defaultManager: "",
  });
  const newEventTypeModalRef = useRef<HTMLDialogElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const router = useRouter();

  const filteredEvents = useMemo(() => {
    if (!searchQuery) {
      return schedules;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return schedules.filter(
      (schedule) =>
        schedule.name.toLowerCase().includes(lowerCaseQuery) ||
        schedule.manager.toLowerCase().includes(lowerCaseQuery) ||
        schedule.schedule.some((s) =>
          s.place.toLowerCase().includes(lowerCaseQuery)
        )
    );
  }, [schedules, searchQuery]);

  const events = useMemo(() => {
    return filteredEvents.map((schedule) => ({ ...schedule }));
  }, [filteredEvents]);

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

  const updateEvent = useCallback((updatedSchedule: Schedule) => {
    setSchedules((prevSchedules) =>
      prevSchedules.map((schedule) =>
        schedule.id === updatedSchedule.id ? updatedSchedule : schedule
      )
    );
    setSelectedScheduleDetail(updatedSchedule);
  }, []);

  const handleDeleteEvent = useCallback(async (scheduleId: number) => {
    if (!confirm("정말로 이 일정을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const accessToken = "your_access_token_here";
      const response = await fetch(
        `https://api.totembe.shop/api/scheduler/${scheduleId}/v1`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 404) {
        const errorData = await response.json();
        throw new Error(errorData.message || "일정 삭제에 실패했습니다.");
      }
      if (!response.ok) {
        throw new Error("일정 삭제에 실패했습니다.");
      }

      const data = await response.json();
      alert(data.message || "일정이 성공적으로 삭제되었습니다.");

      setSchedules((prevSchedules) =>
        prevSchedules.filter((schedule) => schedule.id !== scheduleId)
      );

      setSelectedScheduleId(null);
      setSelectedScheduleDetail(null);
    } catch (e) {
      if (e instanceof Error) {
        alert(`일정 삭제 실패: ${e.message}`);
      } else {
        alert("일정 삭제 중 알 수 없는 오류가 발생했습니다.");
      }
      console.error("Failed to delete schedule:", e);
    }
  }, []);

  const handleOpenNewEventModal = useCallback(
    (
      initialName: string = "",
      initialPlace: string = "",
      initialManager: string = ""
    ) => {
      setIsNewEventModalOpen(true);
      if (newEventModalRef.current) {
        newEventModalRef.current.showModal();
      }
      if (selectedDate) {
        setNewEventDate(selectedDate);
        setNewEventEndDate(selectedDate);
      } else if (today) {
        setNewEventDate(formatDateToYYYYMMDD(today));
        setNewEventEndDate(formatDateToYYYYMMDD(today));
      }
      setNewEventName(initialName);
      setNewEventPlace(initialPlace);
      setNewEventManager(initialManager);
      setNewEventColor("bg-gray-100 text-gray-800 border-gray-200");
    },
    [selectedDate, today]
  );

  const handleCloseNewEventModal = useCallback(() => {
    setIsNewEventModalOpen(false);
    if (newEventModalRef.current) {
      newEventModalRef.current.close();
    }
    setNewEventName("");
    if (today) {
      setNewEventDate(formatDateToYYYYMMDD(today));
      setNewEventEndDate(formatDateToYYYYMMDD(today));
    } else {
      setNewEventDate("");
      setNewEventEndDate("");
    }
    setNewEventPlace("");
    setNewEventManager("");
    setNewEventColor("bg-gray-100 text-gray-800 border-gray-200");
  }, [today]);

  const handleCreateNewEvent = useCallback(async () => {
    if (newEventName && newEventDate && newEventEndDate) {
      const newScheduleData: ScheduleRequestBody = {
        name: newEventName,
        startDate: newEventDate,
        endDate: newEventEndDate,
        manager: newEventManager,
        schedule: [{ time: "11:00", place: newEventPlace }],
        typeId: 1,
        planId: 1,
      };

      try {
        const accessToken = "your_access_token_here";
        const response = await fetch(
          "https://api.totembe.shop/api/scheduler/v1",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(newScheduleData),
          }
        );

        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.message || "회원 정보를 찾을 수 없습니다.");
        }
        if (!response.ok) {
          throw new Error("일정 생성에 실패했습니다.");
        }

        const newSchedule: Schedule = await response.json();
        const scheduleWithColor = {
          ...newSchedule,
          color: newEventColor,
        };
        setSchedules((prevSchedules) => [...prevSchedules, scheduleWithColor]);
        handleCloseNewEventModal();
      } catch (e) {
        if (e instanceof Error) {
          alert(`일정 생성 실패: ${e.message}`);
        } else {
          alert("일정 생성 중 알 수 없는 오류가 발생했습니다.");
        }
        console.error("Failed to create schedule:", e);
      }
    } else {
      alert("일정 이름, 시작 날짜, 종료 날짜를 입력해주세요.");
    }
  }, [
    newEventName,
    newEventDate,
    newEventEndDate,
    newEventPlace,
    newEventManager,
    newEventColor,
    handleCloseNewEventModal,
  ]);

  const handleOpenEditEventModal = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule);
    setEditEventName(schedule.name);
    setEditEventDate(schedule.startDate);
    setEditEventEndDate(schedule.endDate);
    setEditEventPlace(schedule.schedule?.[0]?.place || "");
    setEditEventManager(schedule.manager);
    setEditEventColor(
      schedule.color || "bg-gray-100 text-gray-800 border-gray-200"
    );
    setEditEventNote("");
    setIsEditEventModalOpen(true);
    if (editEventModalRef.current) {
      editEventModalRef.current.showModal();
    }
  }, []);

  const handleCloseEditEventModal = useCallback(() => {
    setIsEditEventModalOpen(false);
    if (editEventModalRef.current) {
      editEventModalRef.current.close();
    }
    setEditingSchedule(null);
  }, []);

  const handleUpdateEvent = useCallback(async () => {
    if (
      !editingSchedule ||
      !editEventName ||
      !editEventDate ||
      !editEventEndDate
    ) {
      alert("일정 이름, 시작 날짜, 종료 날짜를 입력해주세요.");
      return;
    }

    const updatedScheduleData: ScheduleUpdateBody = {
      name: editEventName,
      startDate: editEventDate,
      endDate: editEventEndDate,
      manager: editEventManager,
      schedule: [
        {
          time: editingSchedule.schedule?.[0]?.time || "11:00",
          place: editEventPlace,
        },
      ],
      note: editEventNote,
      typeId: editingSchedule.typeId,
      planId: editingSchedule.planId,
    };

    try {
      const accessToken = "your_access_token_here";
      const response = await fetch(
        `https://api.totembe.shop/api/scheduler/${editingSchedule.id}/v1`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(updatedScheduleData),
        }
      );

      if (response.status === 404) {
        const errorData = await response.json();
        throw new Error(errorData.message || "일정 업데이트에 실패했습니다.");
      }
      if (!response.ok) {
        throw new Error("일정 업데이트에 실패했습니다.");
      }

      const updatedSchedule: Schedule = await response.json();
      const updatedScheduleWithColor = {
        ...updatedSchedule,
        color: editEventColor,
      };
      updateEvent(updatedScheduleWithColor);
      handleCloseEditEventModal();
    } catch (e) {
      if (e instanceof Error) {
        alert(`일정 수정 실패: ${e.message}`);
      } else {
        alert("일정 수정 중 알 수 없는 오류가 발생했습니다.");
      }
      console.error("Failed to update schedule:", e);
    }
  }, [
    editingSchedule,
    editEventName,
    editEventDate,
    editEventEndDate,
    editEventPlace,
    editEventManager,
    editEventNote,
    editEventColor,
    updateEvent,
    handleCloseEditEventModal,
  ]);

  const goToCourseMaker = useCallback(() => {
    router.push("/toolpage/coursemaker");
  }, [router]);

  const handleOpenSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(true);
    if (settingsModalRef.current) {
      settingsModalRef.current.showModal();
    }
  }, []);

  const handleCloseSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
    if (settingsModalRef.current) {
      settingsModalRef.current.close();
    }
  }, []);

  const handleOpenNewEventTypeModal = useCallback(() => {
    setIsNewEventTypeModalOpen(true);
    if (newEventTypeModalRef.current) {
      newEventTypeModalRef.current.showModal();
    }
    const newEventTypeTemplate = {
      name: "",
      emoji: "",
      color: "bg-gray-100 border-gray-200 text-gray-700",
      defaultPlace: "",
      defaultManager: "",
    };
    setNewEventType(newEventTypeTemplate);
    setShowEmojiPicker(false);
  }, []);

  const handleCloseNewEventTypeModal = useCallback(() => {
    setIsNewEventTypeModalOpen(false);
    if (newEventTypeModalRef.current) {
      newEventTypeModalRef.current.close();
    }
    setShowEmojiPicker(false);
  }, []);

  const handleAddEventType = useCallback(async () => {
    if (newEventType.name && newEventType.emoji && newEventType.color) {
      try {
        const accessToken = "your_access_token_here";
        const response = await fetch(
          "https://api.totembe.shop/api/scheduler/labels/v1",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              name: newEventType.name,
              emoji: newEventType.emoji,
              color: newEventType.color,
              defaultPlace: newEventType.defaultPlace,
              defaultManager: newEventType.defaultManager,
            }),
          }
        );

        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.message || "회원 정보를 찾을 수 없습니다.");
        }
        if (!response.ok) {
          throw new Error("일정 타입 추가에 실패했습니다.");
        }

        const addedEventType: EventType = await response.json();
        setEventTypes((prevTypes) => [...prevTypes, addedEventType]);
        handleCloseNewEventTypeModal();
      } catch (e) {
        if (e instanceof Error) {
          alert(`일정 타입 추가 실패: ${e.message}`);
        } else {
          alert("일정 타입 추가 중 알 수 없는 오류가 발생했습니다.");
        }
        console.error("Failed to add event type:", e);
      }
    } else {
      alert("일정 타입 이름, 이모티콘, 색상을 입력해주세요.");
    }
  }, [newEventType, handleCloseNewEventTypeModal]);

  const handleOpenEditLabelModal = useCallback((label: EventType) => {
    setEditingLabel(label);
    setEditLabelName(label.name);
    setEditLabelEmoji(label.emoji);
    setEditLabelColor(label.color);
    setEditLabelDefaultPlace(label.defaultPlace || "");
    setEditLabelDefaultManager(label.defaultManager || "");
    setIsEditLabelModalOpen(true);
    if (editLabelModalRef.current) {
      editLabelModalRef.current.showModal();
    }
  }, []);

  const handleCourseClick = useCallback((schedule: Schedule) => {
    const startDate = new Date(schedule.startDate);
    setCurrentCalendarDate(startDate);
    setSelectedDate(schedule.startDate);
    setSelectedScheduleId(schedule.id);
  }, []);

  const handleCalendarEventClick = useCallback((scheduleId: number) => {
    setSelectedScheduleId(scheduleId);
  }, []);

  const generateCalendarCells = useCallback(() => {
    if (!currentCalendarDate || !today) return [];

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div
          key={`empty-prev-${i}`}
          className="p-2 border-r border-b border-gray-100 bg-gray-50 text-gray-400 min-h-[100px] h-full"
        />
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
            ${
              isToday
                ? "bg-red-100 text-red-700 font-semibold"
                : "bg-white text-gray-800"
            }
            ${isSelected ? "ring-2 ring-blue-500 z-10" : ""}
            min-h-[100px] flex flex-col justify-start items-start
            hover:bg-gray-100 transition-colors duration-150 ease-in-out
            group
          `}
        >
          <div
            className={`font-medium ${
              isToday
                ? "bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center -mt-0.5 -ml-0.5"
                : ""
            }`}
          >
            {day}
          </div>
          <div className="flex flex-col gap-1 w-full mt-1">
            {dayEvents.slice(0, 2).map((event, idx) => (
              <div
                key={event.id || idx}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCalendarEventClick(event.id);
                }}
                className={`${getCalendarEventColorClass(
                  event.color
                )} text-white rounded-sm px-1 py-0.5 text-xs font-medium truncate`}
                title={event.name}
              >
                {event.name}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-600 mt-1">
                +{dayEvents.length - 2}개 더보기
              </div>
            )}
          </div>
        </div>
      );
    }

    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      cells.push(
        <div
          key={`empty-next-${i}`}
          className="p-2 border-r border-b border-gray-100 bg-gray-50 text-gray-400 min-h-[100px]"
        />
      );
    }

    return cells;
  }, [
    currentCalendarDate,
    selectedDate,
    today,
    getOngoingEventsForDate,
    handleCalendarEventClick,
  ]);

  const calendarCells = useMemo(
    () => generateCalendarCells(),
    [generateCalendarCells]
  );

  const goToPrevMonth = () => {
    if (currentCalendarDate) {
      setCurrentCalendarDate(
        new Date(
          currentCalendarDate.getFullYear(),
          currentCalendarDate.getMonth() - 1,
          1
        )
      );
      setSelectedDate(null);
    }
  };

  const goToNextMonth = () => {
    if (currentCalendarDate) {
      setCurrentCalendarDate(
        new Date(
          currentCalendarDate.getFullYear(),
          currentCalendarDate.getMonth() + 1,
          1
        )
      );
      setSelectedDate(null);
    }
  };

  const goToToday = () => {
    if (today) {
      setCurrentCalendarDate(today);
      setSelectedDate(formatDateToYYYYMMDD(today));
    }
  };

  const handleMonthSelectClick = () => {
    if (monthInputRef.current) {
      monthInputRef.current.showPicker();
    }
  };

  const handleMonthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const [year, month] = value.split("-").map(Number);
      setCurrentCalendarDate(new Date(year, month - 1, 1));
      setSelectedDate(null);
    }
  };

  // selectedDateEvents 메모는 더 이상 사용되지 않아 제거했습니다.

  const colorOptions = [
    { value: "bg-blue-100 text-blue-800 border-blue-200", label: "파랑색" },
    { value: "bg-red-100 text-red-800 border-red-200", label: "빨강색" },
    {
      value: "bg-purple-100 text-purple-800 border-purple-200",
      label: "보라색",
    },
    { value: "bg-green-100 text-green-800 border-green-200", label: "초록색" },
    {
      value: "bg-yellow-100 text-yellow-800 border-yellow-200",
      label: "노랑색",
    },
    { value: "bg-teal-100 text-teal-800 border-teal-200", label: "청록색" },
    { value: "bg-indigo-100 text-indigo-800 border-indigo-200", label: "남색" },
    { value: "bg-pink-100 text-pink-800 border-pink-200", label: "분홍색" },
    { value: "bg-gray-100 text-gray-800 border-gray-200", label: "회색" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isModal = (ref: React.RefObject<HTMLDialogElement | null>) =>
        !!ref.current && ref.current.contains(event.target as Node);

      if (isModal(newEventModalRef)) return;
      if (isModal(editEventModalRef)) return;
      if (isModal(newEventTypeModalRef)) {
        if (
          showEmojiPicker &&
          emojiPickerRef.current &&
          emojiPickerRef.current.contains(event.target as Node)
        ) {
          return;
        }
        handleCloseNewEventTypeModal();
        return;
      }
      if (isModal(settingsModalRef)) return;
      if (isModal(labelDetailModalRef)) return;
      if (isModal(editLabelModalRef)) return;

      if (isNewEventModalOpen) handleCloseNewEventModal();
      if (isEditEventModalOpen) handleCloseEditEventModal();
      if (isSettingsModalOpen) handleCloseSettingsModal();
      if (isLabelDetailModalOpen) handleCloseLabelDetailModal();
      if (isEditLabelModalOpen) handleCloseEditLabelModal();
    };

    if (
      isNewEventModalOpen ||
      isEditEventModalOpen ||
      isNewEventTypeModalOpen ||
      isSettingsModalOpen ||
      isLabelDetailModalOpen ||
      isEditLabelModalOpen
    ) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isNewEventModalOpen,
    handleCloseNewEventModal,
    isEditEventModalOpen,
    handleCloseEditEventModal,
    isNewEventTypeModalOpen,
    handleCloseNewEventTypeModal,
    showEmojiPicker,
    isSettingsModalOpen,
    handleCloseSettingsModal,
    isLabelDetailModalOpen,
    handleCloseLabelDetailModal,
    isEditLabelModalOpen,
    handleCloseEditLabelModal,
  ]);

  return (
    <div
      className="h-screen flex flex-col bg-gray-50"
      style={{ fontFamily: "sans-serif" }}
    >
      <input
        ref={monthInputRef}
        type="month"
        onChange={handleMonthInputChange}
        className="hidden"
      />
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gray-300 rounded-md shadow-sm overflow-hidden bg-white">
            <button
              onClick={goToPrevMonth}
              className="p-2 bg-gray-50 hover:bg-gray-200 text-gray-600 transition-colors border-r border-gray-300"
              aria-label="이전 달"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleMonthSelectClick}
              className="w-48 flex items-center justify-between px-3 py-1.5 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              aria-label="월 선택"
            >
              <span>
                {currentCalendarDate.getFullYear()}년{" "}
                {currentCalendarDate.getMonth() + 1}월
              </span>
              <CalendarDays className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 bg-gray-50 hover:bg-gray-200 text-gray-600 transition-colors border-l border-gray-300"
              aria-label="다음 달"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-300 shadow-sm"
          >
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
          <button
            onClick={handleOpenSettingsModal}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
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
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <button
              onClick={() => handleOpenNewEventModal()}
              className="flex items-center justify-center w-full px-3 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors shadow"
            >
              <Plus className="w-4 h-4 mr-2" />
              새로 만들기
            </button>

            <div className="pt-4 border-t border-gray-100 mt-6">
              <h4 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                코스 목록
              </h4>
              <ul className="text-sm list-none p-0">
                {schedules.map((scheduleItem) => (
                  <li
                    key={scheduleItem.id}
                    onClick={() => handleCourseClick(scheduleItem)}
                    className={`
                      mb-1 p-2 rounded-md border truncate hover:opacity-80 transition-colors cursor-pointer
                      ${
                        scheduleItem.color ||
                        "bg-gray-100 text-gray-800 border-gray-200"
                      }
                    `}
                    title={scheduleItem.name}
                  >
                    • {scheduleItem.name}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToCourseMaker}
                className="mt-4 flex items-center w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                코스 추가
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="grid grid-cols-7 flex-shrink-0 border-b border-gray-200 bg-white">
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div
                key={i}
                className={`
                  font-semibold text-center text-xs py-2 border-r border-gray-100 last:border-r-0
                  ${
                    d === "일"
                      ? "text-red-500"
                      : d === "토"
                      ? "text-blue-500"
                      : "text-gray-700"
                  }
                `}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1 overflow-y-auto custom-scrollbar border-l border-gray-200">
            {calendarCells}
          </div>
        </main>

        <aside className="w-80 flex-shrink-0 bg-white border-l border-gray-200 p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <div className="pt-6 border-t border-gray-100 mt-6">
              <h4 className="text-base font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-gray-500" />
                <span>
                  {selectedDate ? `${selectedDate} 일정` : "날짜를 선택하세요"}
                </span>
              </h4>
              {isLoadingDetail ? (
                <div className="text-center text-gray-500">
                  상세 정보 불러오는 중...
                </div>
              ) : detailError ? (
                <div className="text-center text-red-500">
                  오류: {detailError}
                </div>
              ) : selectedScheduleDetail ? (
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 relative">
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-gray-900 text-base font-semibold">
                      {selectedScheduleDetail.name}
                    </strong>
                    <div className="flex space-x-1">
                      <button
                        onClick={() =>
                          handleOpenEditEventModal(selectedScheduleDetail)
                        }
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50"
                        title="일정 편집"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteEvent(selectedScheduleDetail.id)
                        }
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                        title="일정 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-1 text-xs">
                    담당: {selectedScheduleDetail.manager}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    기간: {selectedScheduleDetail.startDate} ~{" "}
                    {selectedScheduleDetail.endDate}
                  </p>
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
                  <p className="text-gray-500 mt-2 text-sm">
                    일정을 클릭하여 상세 정보를 확인하세요.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 mt-6">
                <h5 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                  새 일정 추가
                </h5>
                {isLoadingEventTypes ? (
                  <div className="text-sm text-center text-gray-500">
                    라벨 불러오는 중...
                  </div>
                ) : eventTypesError ? (
                  <div className="text-sm text-center text-red-500">
                    라벨 로딩 실패: {eventTypesError}
                  </div>
                ) : (
                  <ul className="text-sm text-gray-600 list-none p-0 space-y-2">
                    {eventTypes.map((type) => (
                      <li key={type.id}>
                        <button
                          onClick={() =>
                            handleOpenNewEventModal(
                              type.name,
                              type.defaultPlace || "",
                              type.defaultManager || ""
                            )
                          }
                          className={`
                            w-full text-left flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors
                            ${type.color}
                            hover:opacity-80
                          `}
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
              onClick={handleOpenNewEventTypeModal}
              className="flex items-center justify-center w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              일정 타입 추가
            </button>
          </div>
        </aside>
      </div>

      {isNewEventModalOpen && (
        <dialog
          ref={newEventModalRef}
          className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
          onClose={handleCloseNewEventModal}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">새 일정 생성</h3>
              <button
                onClick={handleCloseNewEventModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="newEventName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  일정 이름
                </label>
                <input
                  type="text"
                  id="newEventName"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="새로운 일정 이름을 입력하세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="newEventStartDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  시작 날짜
                </label>
                <input
                  type="date"
                  id="newEventStartDate"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="newEventEndDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  종료 날짜
                </label>
                <input
                  type="date"
                  id="newEventEndDate"
                  value={newEventEndDate}
                  onChange={(e) => setNewEventEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="newEventPlace"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  장소/설명
                </label>
                <input
                  type="text"
                  id="newEventPlace"
                  value={newEventPlace}
                  onChange={(e) => setNewEventPlace(e.target.value)}
                  placeholder="일정 장소 또는 설명을 입력하세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="newEventManager"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  담당자
                </label>
                <input
                  type="text"
                  id="newEventManager"
                  value={newEventManager}
                  onChange={(e) => setNewEventManager(e.target.value)}
                  placeholder="담당자를 입력하세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-200"
                />
              </div>
              <div>
                <label
                  htmlFor="newEventColor"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  색상
                </label>
                <select
                  id="newEventColor"
                  value={newEventColor}
                  onChange={(e) => setNewEventColor(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${newEventColor}`}
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p
                  className={`text-xs mt-1 px-2 py-1 rounded ${newEventColor}`}
                >
                  선택된 색상 미리보기
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCloseNewEventModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateNewEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                생성
              </button>
            </div>
          </div>
        </dialog>
      )}

      {isEditEventModalOpen && editingSchedule && (
        <dialog
          ref={editEventModalRef}
          className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
          onClose={handleCloseEditEventModal}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">일정 편집</h3>
              <button
                onClick={handleCloseEditEventModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="editEventName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  일정 이름
                </label>
                <input
                  type="text"
                  id="editEventName"
                  value={editEventName}
                  onChange={(e) => setEditEventName(e.target.value)}
                  placeholder="일정 이름을 입력하세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="editEventStartDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  시작 날짜
                </label>
                <input
                  type="date"
                  id="editEventStartDate"
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="editEventEndDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  종료 날짜
                </label>
                <input
                  type="date"
                  id="editEventEndDate"
                  value={editEventEndDate}
                  onChange={(e) => setEditEventEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="editEventPlace"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  장소/설명
                </label>
                <input
                  type="text"
                  id="editEventPlace"
                  value={editEventPlace}
                  onChange={(e) => setEditEventPlace(e.target.value)}
                  placeholder="일정 장소 또는 설명을 입력하세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="editEventManager"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  담당자
                </label>
                <input
                  type="text"
                  id="editEventManager"
                  value={editEventManager}
                  onChange={(e) => setEditEventManager(e.target.value)}
                  placeholder="담당자를 입력하세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="editEventNote"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  수정 사유
                </label>
                <input
                  type="text"
                  id="editEventNote"
                  value={editEventNote}
                  onChange={(e) => setEditEventNote(e.target.value)}
                  placeholder="일정 수정 사유를 입력하세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="editEventColor"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  색상
                </label>
                <select
                  id="editEventColor"
                  value={editEventColor}
                  onChange={(e) => setEditEventColor(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${editEventColor}`}
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p
                  className={`text-xs mt-1 px-2 py-1 rounded ${editEventColor}`}
                >
                  선택된 색상 미리보기
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCloseEditEventModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </dialog>
      )}

      {isNewEventTypeModalOpen && (
        <dialog
          ref={newEventTypeModalRef}
          className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
          onClose={handleCloseNewEventTypeModal}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                새 일정 타입 추가
              </h3>
              <button
                onClick={handleCloseNewEventTypeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="eventTypeName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  타입 이름
                </label>
                <input
                  type="text"
                  id="eventTypeName"
                  value={newEventType.name}
                  onChange={(e) =>
                    setNewEventType({ ...newEventType, name: e.target.value })
                  }
                  placeholder="예: 회의, 프로젝트, 휴가"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <label
                  htmlFor="eventTypeEmoji"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이모티콘
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    id="eventTypeEmoji"
                    value={newEventType.emoji}
                    readOnly
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    placeholder="선택하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-100 hover:bg-gray-200 transition-colors"
                    aria-label="이모티콘 선택"
                  >
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute z-20 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 max-h-60 overflow-y-auto"
                    style={{ width: "100%", left: 0 }}
                  >
                    <div className="grid grid-cols-6 gap-1">
                      {emojiList.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setNewEventType({ ...newEventType, emoji });
                            setShowEmojiPicker(false);
                          }}
                          className="p-1 rounded-sm hover:bg-gray-200 text-xl text-center transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="eventTypeColor"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  색상
                </label>
                <select
                  id="eventTypeColor"
                  value={newEventType.color}
                  onChange={(e) =>
                    setNewEventType({ ...newEventType, color: e.target.value })
                  }
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${newEventType.color}`}
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p
                  className={`text-xs mt-1 px-2 py-1 rounded ${newEventType.color}`}
                >
                  선택된 색상 미리보기
                </p>
              </div>
              <div>
                <label
                  htmlFor="eventTypeDefaultPlace"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  기본 장소/설명 (선택)
                </label>
                <input
                  type="text"
                  id="eventTypeDefaultPlace"
                  value={newEventType.defaultPlace}
                  onChange={(e) =>
                    setNewEventType({
                      ...newEventType,
                      defaultPlace: e.target.value,
                    })
                  }
                  placeholder="해당 타입 일정 추가 시 기본 장소"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="eventTypeDefaultManager"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  기본 담당자 (선택)
                </label>
                <input
                  type="text"
                  id="eventTypeDefaultManager"
                  value={newEventType.defaultManager}
                  onChange={(e) => setEditLabelDefaultManager(e.target.value)}
                  placeholder="기본 담당자를 입력하세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCloseNewEventTypeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddEventType}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        </dialog>
      )}

      {isSettingsModalOpen && (
        <dialog
          ref={settingsModalRef}
          className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
          onClose={handleCloseSettingsModal}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">설정</h3>
              <button
                onClick={handleCloseSettingsModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 text-gray-700">
              <div
                onClick={() => {
                  /* 클릭 이벤트 핸들러 추가 */
                }}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <span>알림 설정</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                <span>테마 설정</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                <span>데이터 내보내기</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                <span>사용자 정보 관리</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                <span>보안 및 개인 정보</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                <span>언어 및 지역</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                <span>청구 및 결제</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                <span>도움말 및 지원</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer border-t pt-4 mt-4 border-gray-100">
                <span>계정 관리</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer text-red-600">
                <span>로그아웃</span>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </div>
            </div>
          </div>
        </dialog>
      )}

      {isLabelDetailModalOpen && (
        <dialog
          ref={labelDetailModalRef}
          className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
          onClose={handleCloseLabelDetailModal}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                라벨 상세 정보
              </h3>
              <button
                onClick={handleCloseLabelDetailModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {isLoadingLabelDetail ? (
              <div className="text-center text-gray-500">
                라벨 정보 불러오는 중...
              </div>
            ) : labelDetailError ? (
              <div className="text-center text-red-500">
                오류: {labelDetailError}
              </div>
            ) : selectedLabelDetail ? (
              <div className="space-y-4">
                <p>
                  <strong>ID:</strong> {selectedLabelDetail.id}
                </p>
                <p>
                  <strong>이름:</strong> {selectedLabelDetail.name} (
                  {selectedLabelDetail.emoji})
                </p>
                <p>
                  <strong>기본 장소:</strong>{" "}
                  {selectedLabelDetail.defaultPlace || "없음"}
                </p>
                <p>
                  <strong>기본 담당자:</strong>{" "}
                  {selectedLabelDetail.defaultManager || "없음"}
                </p>
                <p className={`${selectedLabelDetail.color} p-2 rounded-md`}>
                  <strong>색상:</strong>{" "}
                  {selectedLabelDetail.color.split(" ")[0].replace("bg-", "")}
                </p>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => handleDeleteLabel(selectedLabelDetail.id)}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    삭제하기
                  </button>
                  <button
                    onClick={() =>
                      handleOpenEditLabelModal(selectedLabelDetail)
                    }
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    수정하기
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                라벨을 찾을 수 없습니다.
              </div>
            )}
          </div>
        </dialog>
      )}

      {isEditLabelModalOpen && editingLabel && (
        <dialog
          ref={editLabelModalRef}
          className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
          onClose={handleCloseEditLabelModal}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">라벨 수정</h3>
              <button
                onClick={handleCloseEditLabelModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="editLabelName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이름
                </label>
                <input
                  type="text"
                  id="editLabelName"
                  value={editLabelName}
                  onChange={(e) => setEditLabelName(e.target.value)}
                  placeholder="라벨 이름을 입력하세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <label
                  htmlFor="editLabelEmoji"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이모티콘
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    id="editLabelEmoji"
                    value={editLabelEmoji}
                    readOnly
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    placeholder="선택하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-100 hover:bg-gray-200 transition-colors"
                    aria-label="이모티콘 선택"
                  >
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute z-20 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 max-h-60 overflow-y-auto"
                    style={{ width: "100%", left: 0 }}
                  >
                    <div className="grid grid-cols-6 gap-1">
                      {emojiList.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setEditLabelEmoji(emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="p-1 rounded-sm hover:bg-gray-200 text-xl text-center transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="editLabelColor"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  색상
                </label>
                <select
                  id="editLabelColor"
                  value={editLabelColor}
                  onChange={(e) => setEditLabelColor(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${editLabelColor}`}
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="editLabelDefaultPlace"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  기본 장소 (선택)
                </label>
                <input
                  type="text"
                  id="editLabelDefaultPlace"
                  value={editLabelDefaultPlace}
                  onChange={(e) => setEditLabelDefaultPlace(e.target.value)}
                  placeholder="기본 장소를 입력하세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="editLabelDefaultManager"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  기본 담당자 (선택)
                </label>
                <input
                  type="text"
                  id="editLabelDefaultManager"
                  value={editLabelDefaultManager}
                  onChange={(e) => setEditLabelDefaultManager(e.target.value)}
                  placeholder="기본 담당자를 입력하세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCloseEditLabelModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateLabel}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
