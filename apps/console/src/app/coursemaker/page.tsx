// app/toolpage/coursemaker/page.tsx
"use client";

import { useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Script from "next/script";

import { useKakaoMap } from "./hooks/useKakaoMap";
import { useCourseState } from "./hooks/useCourseState";
import TourPlacePanel from "./components/TourPlacePanel";
import SchedulePanel from "./components/SchedulePanel";

export default function CourseMakerPage() {
  const dndBackend = useRef(HTML5Backend);

  const courseState = useCourseState(() => {
    // 장소 드롭 완료 시 클릭 마커 정리
    clearClickedMarker();
  });

  const {
    mapContainerRef,
    kakaoMap,
    initKakaoMap,
    handlePlaceClickFromList,
    clearClickedMarker,
  } = useKakaoMap(courseState.currentSchedule);

  const {
    schedules,
    currentDayIndex,
    currentSchedule,
    goToPrevDay,
    goToNextDay,
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
    handleDropPlace,
    handleMovePlace,
    handleRemovePlace,
    handleCreateCourse,
  } = courseState;

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
              initKakaoMap();
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
            <label className="text-sm font-semibold text-gray-700">
              기간:
            </label>
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
          <TourPlacePanel
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            filterCategory={filterCategory}
            onFilterCategoryChange={setFilterCategory}
            onPlaceClick={handlePlaceClickFromList}
          />

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
          <SchedulePanel
            currentSchedule={currentSchedule}
            currentDayIndex={currentDayIndex}
            schedulesLength={schedules.length}
            onDropPlace={handleDropPlace}
            onMovePlace={handleMovePlace}
            onRemovePlace={handleRemovePlace}
            onPrevDay={goToPrevDay}
            onNextDay={goToNextDay}
          />
        </div>
      </div>
    </DndProvider>
  );
}
