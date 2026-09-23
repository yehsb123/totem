// app/toolpage/coursemaker/components/Tourlist.tsx
"use client";

import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../types";
import { getSpotList, Spot, SpotLoadParams } from "../api/planapi";

// TourPlace 타입을 Spot 타입으로 대체 (API 응답 데이터와 일치하도록)
interface TourItemProps {
  place: Spot;
  onItemClick: (place: Spot) => void;
}

// 개별 관광지 아이템 (드래그 가능 + 클릭 가능)
const TourItem: React.FC<TourItemProps> = ({ place, onItemClick }) => {
  const draggableDivRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TOUR_PLACE,
    item: { ...place, type: ItemTypes.TOUR_PLACE },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  drag(draggableDivRef);

  const getImageUrl = (place: Spot) => {
    return (
      place.firstImage ||
      place.firstImage2 ||
      `https://placehold.co/50x50/A5D2FF/white?text=${place.title.substring(
        0,
        2
      )}`
    );
  };

  return (
    <div
      ref={draggableDivRef}
      onClick={() => onItemClick(place)}
      className={`flex items-center p-3 mb-2 bg-white rounded-lg shadow-sm cursor-grab transition-opacity duration-200 ${
        isDragging ? "opacity-50 border-2 border-blue-400" : "opacity-100"
      }`}
      style={{
        border: isDragging ? "2px dashed #6366F1" : "1px solid #e0e0e0",
      }}
    >
      <Image
        src={getImageUrl(place)}
        alt={place.title}
        width={50}
        height={50}
        className="rounded-md mr-3 object-cover"
        onError={(e) => {
          e.currentTarget.src = `https://placehold.co/50x50/A5D2FF/white?text=${place.title.substring(
            0,
            2
          )}`;
        }}
      />
      <div className="flex-1">
        <div className="font-semibold text-gray-800 text-sm">{place.title}</div>
        <div className="text-xs text-gray-500">
          {/* API 응답에 type 필드가 없으므로, 이 부분은 제거하거나 다른 방식으로 처리해야 합니다. */}
          {place.addr1}
        </div>
      </div>
    </div>
  );
};

// 관광지 목록을 렌더링하는 컴포넌트
interface TourListProps {
  // 이제 외부에서 데이터를 받지 않고, API 파라미터를 받습니다.
  apiParams: SpotLoadParams;
  onItemClick: (place: Spot) => void;
}

const TourList: React.FC<TourListProps> = ({ apiParams, onItemClick }) => {
  const [data, setData] = useState<Spot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);
      try {
        const places = await getSpotList(apiParams);
        if (places) {
          setData(places);
        } else {
          setData([]);
        }
      } catch (e) {
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [apiParams]); // apiParams가 변경될 때마다 재호출

  if (loading) {
    return (
      <p className="text-gray-500 text-center mt-4 text-sm">
        목록을 불러오는 중입니다...
      </p>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center mt-4 text-sm">{error}</p>;
  }

  return (
    <div className="space-y-2">
      {data.length > 0 ? (
        data.map((place, i) => (
          <TourItem
            key={place.title + "-" + i}
            place={place}
            onItemClick={onItemClick}
          />
        ))
      ) : (
        <p className="text-gray-500 text-center mt-4 text-sm">
          검색 결과가 없습니다.
        </p>
      )}
    </div>
  );
};

export default TourList;
