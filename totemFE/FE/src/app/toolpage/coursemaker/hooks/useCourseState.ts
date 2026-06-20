"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import update from "immutability-helper";
import { TourPlace } from "../tourapidata";
import { DaySchedule, CreatedCourse } from "../types";
import { createPlan, PlanMakeParams, deletePlanDetail } from "../api/planapi";

export const TIME_SLOTS = [
  "(숙소)",
  "07:00~08:00",
  "08:00~09:00",
  "09:00~10:00",
  "11:00~12:00",
  "12:00~13:00",
  "13:00~14:00",
  "14:00~15:00",
  "15:00~16:00",
  "16:00~17:00",
  "17:00~18:00",
  "18:00~19:00",
  "19:00~20:00",
  "22:00~23:00",
  "23:00~24:00",
];

export const HOTEL_SLOT_INDEX = 0;

export type FilterCategory =
  | "all"
  | "restaurant"
  | "attraction"
  | "hotel"
  | "cafe"
  | "etc";

export type SortOrder = "popularity" | "foreignPopularity";

export function useCourseState(onDropComplete?: () => void) {
  const router = useRouter();
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);

  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const [courseName, setCourseName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("popularity");

  // 현재 날짜의 스케줄을 Memoization
  const currentSchedule = useMemo(() => {
    if (schedules.length > 0) {
      return schedules[currentDayIndex];
    }
    return { date: "", slots: Array(TIME_SLOTS.length).fill(null) };
  }, [schedules, currentDayIndex]);

  // 1. 컴포넌트 마운트 시 날짜 초기화 및 수정 모드 데이터 로드
  useEffect(() => {
    const loadedCourseId = localStorage.getItem("editCourseId");
    if (loadedCourseId) {
      try {
        const existingCourses = JSON.parse(
          localStorage.getItem("createdCourses") || "[]"
        );
        const courseToEdit = existingCourses.find(
          (c: CreatedCourse) => c.id === loadedCourseId
        );
        if (courseToEdit) {
          setCourseName(courseToEdit.courseName);
          setStartDate(courseToEdit.startDate);
          setEndDate(courseToEdit.endDate);
          setPickupLocation(courseToEdit.pickupLocation);
          setSchedules(courseToEdit.schedules);
          setCurrentDayIndex(0);
          console.log("Course loaded for editing:", courseToEdit);
        }
      } catch (error) {
        console.error("Failed to load course from localStorage:", error);
      } finally {
        localStorage.removeItem("editCourseId");
      }
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const day = today.getDate().toString().padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;
      setStartDate(todayString);
      setEndDate(todayString);
    }
  }, []);

  // 2. 날짜 변경 시 schedules 업데이트
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start.getTime() > end.getTime()) {
        alert("시작일은 종료일보다 빠르거나 같아야 합니다.");
        setStartDate("");
        setEndDate("");
        setSchedules([]);
        setCurrentDayIndex(0);
        return;
      }

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      setSchedules((prevSchedules) => {
        const updatedSchedules: DaySchedule[] = [];
        const prevScheduleMap = new Map(
          prevSchedules.map((day) => [day.date, day])
        );

        for (let i = 0; i < diffDays; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const dateString = date.toISOString().split("T")[0];

          updatedSchedules.push(
            prevScheduleMap.get(dateString) || {
              date: dateString,
              slots: Array(TIME_SLOTS.length).fill(null),
            }
          );
        }
        return updatedSchedules;
      });

      if (currentDayIndex >= diffDays) {
        setCurrentDayIndex(0);
      }
    } else {
      setSchedules([]);
      setCurrentDayIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // 장소 드롭 핸들러
  const handleDropPlace = useCallback(
    (slotIndex: number, droppedPlace: TourPlace) => {
      if (!schedules || schedules.length === 0 || !schedules[currentDayIndex]) {
        console.warn(
          "스케줄이 아직 로드되지 않았거나 유효하지 않습니다. 드롭 작업을 무시합니다."
        );
        return;
      }

      const currentSlots = schedules[currentDayIndex].slots;

      if (currentSlots[slotIndex] !== null) {
        alert("이미 장소가 있는 시간대입니다. 다른 빈 시간대에 추가해주세요.");
        return;
      }

      if (slotIndex === HOTEL_SLOT_INDEX) {
        if (droppedPlace.type !== "hotel") {
          alert("이 시간대는 숙소만 추가할 수 있습니다.");
          return;
        }
      } else {
        if (droppedPlace.type === "hotel") {
          alert("숙소는 숙소 전용 시간대에만 추가할 수 있습니다.");
          return;
        }
      }

      setSchedules((prevSchedules) => {
        if (
          !prevSchedules ||
          prevSchedules.length === 0 ||
          !prevSchedules[currentDayIndex]
        ) {
          console.error(
            "prevSchedules 상태가 유효하지 않습니다. (handleDropPlace 내부)"
          );
          return prevSchedules;
        }

        const updatedSlots = [...prevSchedules[currentDayIndex].slots];
        updatedSlots[slotIndex] = droppedPlace;

        return prevSchedules.map((day, index) =>
          index === currentDayIndex ? { ...day, slots: updatedSlots } : day
        );
      });

      onDropComplete?.();
    },
    [schedules, currentDayIndex, onDropComplete]
  );

  // 스케줄 내 장소 순서 변경 핸들러
  const handleMovePlace = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setSchedules((prevSchedules) => {
        const currentDaySlots = [...prevSchedules[currentDayIndex].slots];
        const dragPlace = currentDaySlots[dragIndex];

        if (!dragPlace) return prevSchedules;

        if (dragPlace.type === "hotel") {
          if (
            dragIndex !== HOTEL_SLOT_INDEX ||
            hoverIndex !== HOTEL_SLOT_INDEX
          ) {
            alert(
              "숙소는 숙소 전용 시간대에서만 드래그 및 드롭될 수 있습니다."
            );
            return prevSchedules;
          }
          if (
            currentDaySlots[hoverIndex] !== null &&
            dragIndex !== hoverIndex
          ) {
            alert("숙소 슬롯에는 하나의 숙소만 배치할 수 있습니다.");
            return prevSchedules;
          }
        } else {
          if (hoverIndex === HOTEL_SLOT_INDEX) {
            alert("일반 장소는 숙소 전용 시간대로 이동할 수 없습니다.");
            return prevSchedules;
          }
        }

        const newSlots = update(currentDaySlots, {
          $splice: [
            [dragIndex, 1, currentDaySlots[hoverIndex]],
            [hoverIndex, 1, dragPlace],
          ],
        });

        return prevSchedules.map((day, idx) =>
          idx === currentDayIndex ? { ...day, slots: newSlots } : day
        );
      });
    },
    [currentDayIndex]
  );

  // 장소 제거 핸들러
  const handleRemovePlace = useCallback(
    async (slotIndex: number) => {
      const placeToRemove = schedules[currentDayIndex].slots[slotIndex];
      if (!placeToRemove || !currentPlanId) {
        alert("삭제할 장소가 없거나 투어 ID가 유효하지 않습니다.");
        return;
      }

      const accessToken = "your_access_token_here";
      const day = currentDayIndex + 1;

      try {
        const response = await deletePlanDetail(
          currentPlanId,
          day,
          accessToken
        );

        if (response) {
          console.log("API를 통해 일자별 코스 삭제 완료:", response);
          alert("장소가 성공적으로 삭제되었습니다.");
          setSchedules((prevSchedules) => {
            const updatedSlots = [...prevSchedules[currentDayIndex].slots];
            updatedSlots[slotIndex] = null;
            return prevSchedules.map((day, idx) =>
              idx === currentDayIndex ? { ...day, slots: updatedSlots } : day
            );
          });
        } else {
          alert("장소 삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("장소 삭제 중 오류 발생:", error);
        alert("장소 삭제 중 오류가 발생했습니다.");
      }
    },
    [currentPlanId, currentDayIndex, schedules]
  );

  // 코스 생성 완료
  const handleCreateCourse = useCallback(async () => {
    if (!courseName.trim()) {
      alert("코스 이름을 입력해주세요.");
      return;
    }
    if (!startDate || !endDate) {
      alert("코스 기간을 선택해주세요.");
      return;
    }
    const hasAnyPlace = schedules.some((day) =>
      day.slots.some((slot) => slot !== null)
    );
    if (!hasAnyPlace) {
      alert("최소한 하나의 장소를 스케줄에 추가해주세요.");
      return;
    }

    const newCourse: CreatedCourse = {
      id: Date.now().toString(),
      courseName,
      startDate,
      endDate,
      pickupLocation,
      schedules,
    };

    const planData: PlanMakeParams = {
      title: courseName,
      start_date: Number(startDate.replace(/-/g, "")),
      end_date: Number(endDate.replace(/-/g, "")),
      nation: "한국",
      age: 25,
      gender: "both",
      number: 1,
      note: "자동 생성된 코스입니다.",
    };

    const accessToken = "your_access_token_here";
    try {
      const apiResponse = await createPlan(planData, accessToken);

      if (apiResponse) {
        console.log("새로운 투어 계획 생성 및 저장 완료:", apiResponse);
        alert(
          `코스가 성공적으로 생성되었습니다! (Plan ID: ${apiResponse.plan_id})`
        );
        setCurrentPlanId(apiResponse.plan_id);

        const existingCoursesString = localStorage.getItem("createdCourses");
        const existingCourses: CreatedCourse[] = existingCoursesString
          ? JSON.parse(existingCoursesString)
          : [];
        existingCourses.push(newCourse);
        localStorage.setItem("createdCourses", JSON.stringify(existingCourses));

        router.push("/toolpage/tour");
      } else {
        alert("코스 생성에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("코스 생성 중 오류 발생:", error);
      alert("코스 생성 중 오류가 발생했습니다.");
    }
  }, [courseName, startDate, endDate, pickupLocation, schedules, router]);

  // 일차 이동
  const goToPrevDay = useCallback(() => {
    setCurrentDayIndex((prev) =>
      prev > 0 ? prev - 1 : schedules.length - 1
    );
  }, [schedules.length]);

  const goToNextDay = useCallback(() => {
    setCurrentDayIndex((prev) =>
      prev < schedules.length - 1 ? prev + 1 : 0
    );
  }, [schedules.length]);

  return {
    // 스케줄 상태
    schedules,
    currentDayIndex,
    currentSchedule,
    goToPrevDay,
    goToNextDay,

    // 폼 상태
    courseName,
    setCourseName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pickupLocation,
    setPickupLocation,
    filterCategory,
    setFilterCategory,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder,

    // 핸들러
    handleDropPlace,
    handleMovePlace,
    handleRemovePlace,
    handleCreateCourse,
  };
}
