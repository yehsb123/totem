"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Spot } from "../api/planapi";
import type { DaySchedule } from "../types";

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

const DEFAULT_CENTER = { lat: 33.450701, lng: 126.570667 };
const DEFAULT_LEVEL = 3;

export function useKakaoMap(currentSchedule: DaySchedule) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [kakaoMap, setKakaoMap] = useState<KakaoMap | null>(null);
  const [markers, setMarkers] = useState<KakaoMarker[]>([]);
  const [clickedPlaceMarker, setClickedPlaceMarker] =
    useState<KakaoMarker | null>(null);
  const [clickedPlaceInfowindow, setClickedPlaceInfowindow] =
    useState<KakaoInfoWindow | null>(null);

  // Kakao Maps SDK 로드 후 지도를 초기화하는 함수
  const initKakaoMap = useCallback(() => {
    if (mapContainerRef.current && window.kakao && window.kakao.maps) {
      if (!kakaoMap) {
        const mapContainer = mapContainerRef.current;
        const mapOption = {
          center: new window.kakao.maps.LatLng(
            DEFAULT_CENTER.lat,
            DEFAULT_CENTER.lng
          ),
          level: DEFAULT_LEVEL,
        };
        const map = new window.kakao.maps.Map(mapContainer, mapOption);
        setKakaoMap(map);
        console.log("Kakao Map initialized.");
      }
    }
  }, [kakaoMap]);

  // 현재 스케줄에 따른 마커 업데이트
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
      setMarkers([]);

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

      if (newMarkers.length > 0) {
        kakaoMap.setBounds(bounds);
      } else if (!clickedPlaceMarker) {
        kakaoMap.setCenter(
          new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
        );
        kakaoMap.setLevel(DEFAULT_LEVEL);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchedule, kakaoMap, clickedPlaceInfowindow, clickedPlaceMarker]);

  // TourList에서 장소 클릭 시 지도 이동 및 마커 표시
  const handlePlaceClickFromList = useCallback(
    (place: Spot) => {
      console.log("---------------------------------------");
      console.log("장소 클릭됨:", place.title);
      console.log("지도 객체 유효성 (kakaoMap):", !!kakaoMap);
      console.log("장소 좌표 (mapY, mapX):", place.mapY, place.mapX);
      console.log("---------------------------------------");

      if (kakaoMap && place.mapY && place.mapX) {
        if (clickedPlaceMarker) {
          clickedPlaceMarker.setMap(null);
          setClickedPlaceMarker(null);
        }
        if (clickedPlaceInfowindow) {
          clickedPlaceInfowindow.close();
          setClickedPlaceInfowindow(null);
        }

        const moveLatLon = new window.kakao.maps.LatLng(
          place.mapY,
          place.mapX
        );

        kakaoMap.setCenter(moveLatLon);
        kakaoMap.setLevel(DEFAULT_LEVEL);

        const tempMarker = new window.kakao.maps.Marker({
          map: kakaoMap,
          position: moveLatLon,
          title: place.title,
        });

        const tempInfowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px;font-size:12px;color:black;">${place.title}</div>`,
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

  // 장소 드롭/제거 후 클릭 마커를 정리하는 헬퍼
  const clearClickedMarker = useCallback(() => {
    if (clickedPlaceMarker) {
      clickedPlaceMarker.setMap(null);
      setClickedPlaceMarker(null);
    }
    if (clickedPlaceInfowindow) {
      clickedPlaceInfowindow.close();
      setClickedPlaceInfowindow(null);
    }
  }, [clickedPlaceMarker, clickedPlaceInfowindow]);

  return {
    mapContainerRef,
    kakaoMap,
    initKakaoMap,
    handlePlaceClickFromList,
    clearClickedMarker,
  };
}
