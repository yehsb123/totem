// app/toolpage/coursemaker/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TourList from "./components/Tourlist";
import ScheduleColumn from "./components/schedulecolumn";
import { useRouter } from "next/navigation";
import { TourPlace } from "./tourapidata";
import Script from "next/script";
import update from "immutability-helper";

// planapi.ts에서 createPlan 함수와 타입을 임포트합니다.
import { createPlan, PlanMakeParams, deletePlanDetail } from "./api/planapi";
import type { Spot } from "./api/planapi";

// 타입과 상수들을 별도 파일에서 import
import { DaySchedule, CreatedCourse } from "./types";

// Kakao Maps API의 전역 객체 'kakao'를 TypeScript가 인식하도록 선언
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KakaoMap = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KakaoMarker = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KakaoInfoWindow = any;
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao: any;
  }
}

export default function CourseMakerPage() {
  const router = useRouter();
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);

  const timeSlots = [
    "(숙소)", // 숙소 전용 슬롯
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
  const HOTEL_SLOT_INDEX = 0; // 숙소 슬롯은 첫 번째 인덱스 (0)

  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const [courseName, setCourseName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<
    "all" | "restaurant" | "attraction" | "hotel" | "cafe" | "etc"
  >("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<
    "popularity" | "foreignPopularity"
  >("popularity");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [kakaoMap, setKakaoMap] = useState<KakaoMap | null>(null);
  const [markers, setMarkers] = useState<KakaoMarker[]>([]);
  const [clickedPlaceMarker, setClickedPlaceMarker] =
    useState<KakaoMarker | null>(null);
  const [clickedPlaceInfowindow, setClickedPlaceInfowindow] =
    useState<KakaoInfoWindow | null>(null);

  const dndBackend = useRef(HTML5Backend); // DndProvider에 HTML5Backend 전달

  // 현재 날짜의 스케줄을 Memoization하여 불필요한 렌더링 방지
  const currentSchedule = useMemo(() => {
    if (schedules.length > 0) {
      return schedules[currentDayIndex];
    }
    return { date: "", slots: Array(timeSlots.length).fill(null) };
  }, [schedules, currentDayIndex, timeSlots.length]);

  // Kakao Maps SDK 로드 후 지도를 초기화하는 함수 (useCallback으로 감싸 메모이제이션)
  const initKakaoMap = useCallback(() => {
    if (mapContainerRef.current && window.kakao && window.kakao.maps) {
      // kakaoMap이 이미 초기화되었다면 다시 초기화하지 않음
      if (!kakaoMap) {
        const mapContainer = mapContainerRef.current;
        const mapOption = {
          center: new window.kakao.maps.LatLng(33.450701, 126.570667), // 제주도 초기 중심 좌표
          level: 3,
        };
        const map = new window.kakao.maps.Map(mapContainer, mapOption);
        setKakaoMap(map);
        console.log("Kakao Map initialized.");
      }
    }
  }, [kakaoMap]); // kakaoMap이 null일 때만 초기화되도록 의존성 배열에 추가

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
          // 수정 모드 로드 시 currentDayIndex도 적절히 설정
          setCurrentDayIndex(0); // 첫 날짜로 설정
          console.log("Course loaded for editing:", courseToEdit);
        }
      } catch (error) {
        console.error("Failed to load course from localStorage:", error);
      } finally {
        localStorage.removeItem("editCourseId"); // 사용 후 ID 제거
      }
    } else {
      // 수정 모드가 아니면 오늘 날짜로 초기화 (최초 한 번만)
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const day = today.getDate().toString().padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;
      setStartDate(todayString);
      setEndDate(todayString);
    }
  }, []); // ⭐️ 빈 의존성 배열: 컴포넌트 마운트 시 단 한 번만 실행

  // 2. 날짜 (startDate, endDate) 변경 시 schedules 업데이트 로직
  // 이 useEffect는 startDate 또는 endDate가 변경될 때마다 실행됩니다.
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start.getTime() > end.getTime()) {
        alert("시작일은 종료일보다 빠르거나 같아야 합니다.");
        // 유효하지 않은 날짜 범위이므로, 이전 상태로 되돌리거나 초기화
        setStartDate("");
        setEndDate("");
        setSchedules([]);
        setCurrentDayIndex(0); // 현재 일차도 초기화
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

          // 기존 스케줄이 있다면 재사용, 없으면 새 스케줄 생성
          updatedSchedules.push(
            prevScheduleMap.get(dateString) || {
              date: dateString,
              slots: Array(timeSlots.length).fill(null),
            }
          );
        }
        return updatedSchedules;
      });

      // 날짜 범위가 줄어들었을 때 currentDayIndex 조정
      if (currentDayIndex >= diffDays) {
        setCurrentDayIndex(0);
      }
    } else {
      // startDate 또는 endDate가 비어있으면 스케줄 초기화
      setSchedules([]);
      setCurrentDayIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, timeSlots.length]);
  // schedules.length도 제거: schedules 상태가 업데이트될 때 이 effect가 재실행되는 것을 방지
  // 이 effect는 오직 startDate, endDate, timeSlots.length에만 의존합니다.

  // 현재 스케줄에 따른 마커 업데이트 로직 (기존과 동일, `markers`와 `setMarkers` 의존성 추가 수정됨)
  useEffect(() => {
    if (kakaoMap) {
      // 기존 마커 및 인포윈도우 정리
      markers.forEach((marker) => {
        if (marker !== clickedPlaceMarker) {
          marker.setMap(null);
        }
      });
      if (clickedPlaceInfowindow) {
        clickedPlaceInfowindow.close();
      }
      setMarkers([]); // 기존 마커 배열 초기화

      const newMarkers: KakaoMarker[] = [];
      const bounds = new window.kakao.maps.LatLngBounds();

      currentSchedule.slots.forEach((place) => {
        if (place && place.mapY && place.mapX) {
          const markerPosition = new window.kakao.maps.LatLng(
            place.mapY,
            place.mapX
          );

          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
            map: kakaoMap,
            title: place.title,
          });

          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:5px;font-size:12px;color:black;">${place.title}</div>`,
          });
          // 마커 클릭 시 인포윈도우 열기
          window.kakao.maps.event.addListener(marker, "click", function () {
            if (clickedPlaceInfowindow) {
              clickedPlaceInfowindow.close();
            }
            infowindow.open(kakaoMap, marker);
            setClickedPlaceInfowindow(infowindow);
          });

          newMarkers.push(marker);
          bounds.extend(markerPosition);
        }
      });
      setMarkers(newMarkers);

      // 마커가 있다면 지도 범위 재설정
      if (newMarkers.length > 0) {
        kakaoMap.setBounds(bounds);
      } else if (!clickedPlaceMarker) {
        // 스케줄에 장소가 없고, 개별 클릭 마커도 없다면 제주도 초기 위치로
        kakaoMap.setCenter(new window.kakao.maps.LatLng(33.450701, 126.570667));
        kakaoMap.setLevel(3);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchedule, kakaoMap, clickedPlaceInfowindow, clickedPlaceMarker]);

  // TourList에서 장소 클릭 시 지도 이동 및 마커 표시 핸들러
  const handlePlaceClickFromList = useCallback(
    (place: Spot) => {
      console.log("---------------------------------------");
      console.log("장소 클릭됨:", place.title);
      console.log("지도 객체 유효성 (kakaoMap):", !!kakaoMap);
      console.log("장소 좌표 (mapY, mapX):", place.mapY, place.mapX);
      console.log("---------------------------------------");

      if (kakaoMap && place.mapY && place.mapX) {
        // 이전에 클릭된 마커와 인포윈도우가 있다면 제거
        if (clickedPlaceMarker) {
          clickedPlaceMarker.setMap(null);
          setClickedPlaceMarker(null);
        }
        if (clickedPlaceInfowindow) {
          clickedPlaceInfowindow.close();
          setClickedPlaceInfowindow(null);
        }

        const moveLatLon = new window.kakao.maps.LatLng(place.mapY, place.mapX);

        kakaoMap.setCenter(moveLatLon);
        kakaoMap.setLevel(3);

        const tempMarker = new window.kakao.maps.Marker({
          map: kakaoMap,
          position: moveLatLon,
          title: place.title,
        });

        const tempInfowindow = new window.kakao.maps.InfoWindow({
          content: `<div style=\"padding:5px;font-size:12px;color:black;\">${place.title}</div>`,
          removable: true,
        });
        tempInfowindow.open(kakaoMap, tempMarker);

        setClickedPlaceMarker(tempMarker);
        setClickedPlaceInfowindow(tempInfowindow);
      } else {
        console.warn(
          "지도 객체가 없거나 장소 좌표(mapY, mapX)가 유효하지 않아 지도를 이동할 수 없습니다. 장소:",
          place
        );
      }
    },
    [kakaoMap, clickedPlaceMarker, clickedPlaceInfowindow]
  );

  // 장소 드롭 핸들러 (새로운 장소를 스케줄에 추가할 때)
  const handleDropPlace = useCallback(
    (slotIndex: number, droppedPlace: TourPlace) => {
      // schedules 배열이 존재하고, 비어있지 않으며, currentDayIndex에 해당하는 항목이 유효한지 확인
      if (!schedules || schedules.length === 0 || !schedules[currentDayIndex]) {
        console.warn(
          "스케줄이 아직 로드되지 않았거나 유효하지 않습니다. 드롭 작업을 무시합니다."
        );
        // 사용자에게 메시지를 보여주는 UI (예: 토스트 알림)를 추가하는 것을 고려해 보세요.
        return; // 스케줄이 유효하지 않으면 함수 실행을 중단
      }

      const currentSlots = schedules[currentDayIndex].slots;

      // 이미 장소가 있는 슬롯에 드롭하는 경우
      if (currentSlots[slotIndex] !== null) {
        alert("이미 장소가 있는 시간대입니다. 다른 빈 시간대에 추가해주세요.");
        return;
      }

      // 숙소 슬롯 예외 처리
      if (slotIndex === HOTEL_SLOT_INDEX) {
        if (droppedPlace.type !== "hotel") {
          alert("이 시간대는 숙소만 추가할 수 있습니다.");
          return;
        }
      } else {
        // 일반 시간대
        if (droppedPlace.type === "hotel") {
          alert("숙소는 숙소 전용 시간대에만 추가할 수 있습니다.");
          return;
        }
      }

      setSchedules((prevSchedules) => {
        // 방어적으로 한 번 더 prevSchedules 상태의 유효성을 확인
        if (
          !prevSchedules ||
          prevSchedules.length === 0 ||
          !prevSchedules[currentDayIndex]
        ) {
          console.error(
            "prevSchedules 상태가 유효하지 않습니다. (handleDropPlace 내부)"
          );
          return prevSchedules; // 기존 상태를 그대로 반환하여 오류 방지
        }

        const updatedSlots = [...prevSchedules[currentDayIndex].slots];
        updatedSlots[slotIndex] = droppedPlace;

        return prevSchedules.map((day, index) =>
          index === currentDayIndex ? { ...day, slots: updatedSlots } : day
        );
      });

      // 장소를 드롭하면 개별 클릭 마커/인포윈도우는 제거
      if (clickedPlaceMarker) {
        clickedPlaceMarker.setMap(null);
        setClickedPlaceMarker(null);
      }
      if (clickedPlaceInfowindow) {
        clickedPlaceInfowindow.close();
        setClickedPlaceInfowindow(null);
      }
    },
    [
      schedules, // ⭐️ schedules를 의존성 배열에 유지
      currentDayIndex,
      HOTEL_SLOT_INDEX,
      clickedPlaceMarker,
      clickedPlaceInfowindow,
    ]
  );

  // 스케줄 내에서 장소 순서를 변경하는 핸들러 (기존과 동일)
  const handleMovePlace = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setSchedules((prevSchedules) => {
        const currentDaySlots = [...prevSchedules[currentDayIndex].slots];
        const dragPlace = currentDaySlots[dragIndex];

        if (!dragPlace) return prevSchedules; // 드래그할 장소가 없으면 변경 없음

        // ⭐️ 숙소 슬롯 예외 처리 (강화): 숙소는 숙소 슬롯(HOTEL_SLOT_INDEX) 내에서만 이동
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
          // 숙소는 숙소 슬롯 내에서 다른 장소와 교체될 수 없고, null과만 교체 (교체 시도시 경고)
          if (
            currentDaySlots[hoverIndex] !== null &&
            dragIndex !== hoverIndex
          ) {
            alert("숙소 슬롯에는 하나의 숙소만 배치할 수 있습니다.");
            return prevSchedules;
          }
        } else {
          // 일반 장소: 숙소 슬롯으로 이동 불가
          if (hoverIndex === HOTEL_SLOT_INDEX) {
            alert("일반 장소는 숙소 전용 시간대로 이동할 수 없습니다.");
            return prevSchedules;
          }
        }

        // immutability-helper를 사용하여 불변성을 유지하며 배열 업데이트
        const newSlots = update(currentDaySlots, {
          $splice: [
            [dragIndex, 1, currentDaySlots[hoverIndex]], // dragIndex의 장소를 제거하고 hoverPlace를 넣음
            [hoverIndex, 1, dragPlace], // hoverIndex의 장소를 제거하고 dragPlace를 넣음
          ],
        });

        return prevSchedules.map((day, idx) =>
          idx === currentDayIndex ? { ...day, slots: newSlots } : day
        );
      });
    },
    [currentDayIndex, HOTEL_SLOT_INDEX]
  );

  // 스케줄에서 장소를 제거하는 핸들러 (기존과 동일)
  const handleRemovePlace = useCallback(
    async (slotIndex: number) => {
      const placeToRemove = schedules[currentDayIndex].slots[slotIndex];
      if (!placeToRemove || !currentPlanId) {
        alert("삭제할 장소가 없거나 투어 ID가 유효하지 않습니다.");
        return;
      }

      // API 호출을 위한 데이터 준비
      const accessToken = "your_access_token_here"; // 실제 토큰으로 교체
      const day = currentDayIndex + 1; // 1-based index

      try {
        const response = await deletePlanDetail(
          currentPlanId,
          day,
          accessToken
        );

        if (response) {
          console.log("API를 통해 일자별 코스 삭제 완료:", response);
          alert("장소가 성공적으로 삭제되었습니다.");
          // 로컬 상태 업데이트
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

  // 장소 목록 필터링 및 정렬 (기존과 동일)

  // 코스 생성 완료 버튼 핸들러 (API 호출 로직 추가)
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

    // 새로운 코스 객체 생성 (로컬스토리지 저장을 위한 객체)
    const newCourse: CreatedCourse = {
      id: Date.now().toString(), // 고유 ID (간단하게 타임스탬프 사용)
      courseName,
      startDate: startDate,
      endDate: endDate,
      pickupLocation,
      schedules,
    };

    // plan_make API 호출을 위한 데이터 준비
    const planData: PlanMakeParams = {
      title: courseName,
      start_date: Number(startDate.replace(/-/g, "")),
      end_date: Number(endDate.replace(/-/g, "")),
      nation: "한국", //  실제는 사용자 입력값으로 대체 필요
      age: 25, // 실제는 사용자 입력값으로 대체 필요
      gender: "both", //  실제는 사용자 입력값으로 대체 필요
      number: 1, //  실제는 사용자 입력값으로 대체 필요
      note: "자동 생성된 코스입니다.", //실제는 사용자 입력값으로 대체 필요
    };

    // 인증 토큰 준비 (예시: 실제로는 로그인 후 저장된 토큰 사용)
    const accessToken = "your_access_token_here"; //
    try {
      // API 호출
      const apiResponse = await createPlan(planData, accessToken);

      if (apiResponse) {
        console.log("새로운 투어 계획 생성 및 저장 완료:", apiResponse);
        alert(
          `코스가 성공적으로 생성되었습니다! (Plan ID: ${apiResponse.plan_id})`
        );
        setCurrentPlanId(apiResponse.plan_id);

        // API 호출 성공 시 로컬스토리지에도 저장
        const existingCoursesString = localStorage.getItem("createdCourses");
        const existingCourses: CreatedCourse[] = existingCoursesString
          ? JSON.parse(existingCoursesString)
          : [];
        existingCourses.push(newCourse);
        localStorage.setItem("createdCourses", JSON.stringify(existingCourses));

        router.push("/toolpage/tour"); // 투어 관리 페이지로 이동
      } else {
        alert("코스 생성에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("코스 생성 중 오류 발생:", error);
      alert("코스 생성 중 오류가 발생했습니다.");
    }
  }, [courseName, startDate, endDate, pickupLocation, schedules, router]);

  return (
    <DndProvider backend={dndBackend.current}>
      {/* Kakao Maps API 스크립트 로드 */}
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services,clusterer,drawing&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          if (window.kakao) {
            window.kakao.maps.load(() => {
              console.log("Kakao Maps SDK loaded and ready.");
              initKakaoMap(); // 지도를 초기화하는 함수 호출
            });
          }
        }}
        onError={(e) => {
          console.error("Kakao Maps Script load failed:", e);
        }}
      />

      <div className="flex flex-col h-full bg-gray-50">
        {/* 상단 날짜 선택 및 코스 정보 입력 영역 */}
        <div className="flex-shrink-0 bg-white px-8 py-4 shadow-md flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">
              코스 이름:
            </label>
            <input
              type="text"
              placeholder="코스 이름을 입력하세요"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-64 placeholder-gray-500 text-black"
            />
            <label className="text-sm font-semibold text-gray-700 ml-6">
              픽업 장소:
            </label>
            <input
              type="text"
              placeholder="픽업 장소를 입력하세요"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-64 placeholder-gray-500 text-black"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">기간:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min="2024-01-01"
              max="2026-12-31"
              className="border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-[140px] text-black"
            />
            <span className="text-gray-600">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min="2024-01-01"
              max="2026-12-31"
              className="border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-[140px] text-black"
            />
            <button
              onClick={handleCreateCourse}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-md transition-colors duration-200"
            >
              코스 생성 완료
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 (왼쪽 장소, 지도, 오른쪽 스케줄) */}
        <div className="flex flex-1 overflow-hidden">
          {/* 왼쪽 장소 리스트 */}
          <aside className="w-[280px] flex-shrink-0 border-r border-gray-200 bg-white p-4 flex flex-col shadow-inner">
            <h3 className="text-lg font-bold text-black mb-4">장소 선택</h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="장소를 검색하세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
              />
            </div>
            {/* 정렬 옵션 버튼 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSortOrder("popularity")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  sortOrder === "popularity"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                인기순
              </button>
              <button
                onClick={() => setSortOrder("foreignPopularity")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  sortOrder === "foreignPopularity"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                외국인 인기순
              </button>
            </div>
            {/* 카테고리 필터 버튼 */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filterCategory === "all"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterCategory("attraction")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filterCategory === "attraction"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                관광지
              </button>
              <button
                onClick={() => setFilterCategory("restaurant")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filterCategory === "restaurant"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                식당
              </button>
              <button
                onClick={() => setFilterCategory("hotel")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filterCategory === "hotel"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                숙소
              </button>
              <button
                onClick={() => setFilterCategory("cafe")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filterCategory === "cafe"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                카페
              </button>
              <button
                onClick={() => setFilterCategory("etc")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filterCategory === "etc"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                기타
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
              <TourList
                apiParams={{ lang: "kr", sigunguCode: 3, lclsSystm1: "AC" }}
                onItemClick={handlePlaceClickFromList}
              />
            </div>
          </aside>

          {/* 지도 영역 */}
          <main className="flex-1 relative bg-blue-50 border-r border-gray-200">
            <div
              id="map"
              ref={mapContainerRef}
              style={{ width: "100%", height: "100%" }}
            >
              {!kakaoMap && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xl font-medium">
                  지도 로딩 중...
                </div>
              )}
            </div>
          </main>

          {/* 오른쪽 스케줄 영역 */}
          <aside className="w-[320px] flex-shrink-0 bg-white p-4 flex flex-col shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {currentSchedule.date
                  ? `${currentSchedule.date} (${currentDayIndex + 1}일차)`
                  : "날짜를 선택하여 코스를 생성하세요"}
              </h3>
              <div className="flex gap-2">
                {schedules.length > 1 && (
                  <button
                    onClick={() =>
                      setCurrentDayIndex((prev) =>
                        prev > 0 ? prev - 1 : schedules.length - 1
                      )
                    }
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors duration-200"
                  >
                    이전 일차
                  </button>
                )}
                {schedules.length > 1 && (
                  <button
                    onClick={() =>
                      setCurrentDayIndex((prev) =>
                        prev < schedules.length - 1 ? prev + 1 : 0
                      )
                    }
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
                timeSlots={timeSlots}
                onDrop={handleDropPlace}
                onMovePlace={handleMovePlace}
                onRemovePlace={handleRemovePlace}
                hotelSlotIndex={HOTEL_SLOT_INDEX}
              />
            </div>
          </aside>
        </div>
      </div>
    </DndProvider>
  );
}
