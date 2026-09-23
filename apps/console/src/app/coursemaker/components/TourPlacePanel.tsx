"use client";

import React from "react";
import TourList from "./Tourlist";
import type { Spot } from "../api/planapi";
import type { FilterCategory, SortOrder } from "../hooks/useCourseState";

interface TourPlacePanelProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
  filterCategory: FilterCategory;
  onFilterCategoryChange: (value: FilterCategory) => void;
  onPlaceClick: (place: Spot) => void;
}

const CATEGORIES: { value: FilterCategory; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "attraction", label: "관광지" },
  { value: "restaurant", label: "식당" },
  { value: "hotel", label: "숙소" },
  { value: "cafe", label: "카페" },
  { value: "etc", label: "기타" },
];

const TourPlacePanel: React.FC<TourPlacePanelProps> = ({
  searchTerm,
  onSearchTermChange,
  sortOrder,
  onSortOrderChange,
  filterCategory,
  onFilterCategoryChange,
  onPlaceClick,
}) => {
  return (
    <aside className="w-[280px] flex-shrink-0 border-r border-gray-200 bg-white p-4 flex flex-col shadow-inner">
      <h3 className="text-lg font-bold text-black mb-4">장소 선택</h3>
      <div className="mb-4">
        <input
          type="text"
          placeholder="장소를 검색하세요..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />
      </div>
      {/* 정렬 옵션 버튼 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onSortOrderChange("popularity")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
            sortOrder === "popularity"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          인기순
        </button>
        <button
          onClick={() => onSortOrderChange("foreignPopularity")}
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
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onFilterCategoryChange(cat.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
              filterCategory === cat.value
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <TourList
          apiParams={{ lang: "kr", sigunguCode: 3, lclsSystm1: "AC" }}
          onItemClick={onPlaceClick}
        />
      </div>
    </aside>
  );
};

export default TourPlacePanel;
