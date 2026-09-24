"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EditorDay } from "../courseModel";

/* eslint-disable @typescript-eslint/no-explicit-any -- Kakao 지도 SDK 는 타입 정의를 제공하지 않는다 */
declare global {
  interface Window {
    kakao?: any;
  }
}

/** 제주 중심 */
const DEFAULT_CENTER = { lat: 33.38, lng: 126.55 };
const DEFAULT_LEVEL = 9;

interface MapPoint {
  title: string;
  mapX: number;
  mapY: number;
}

/** 장소 이름은 외부(TourAPI) 데이터라 HTML 로 넣기 전에 이스케이프한다 */
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const infoHtml = (title: string) => `<div style="padding:6px 8px;font-size:12px;color:#111;white-space:nowrap">${escapeHtml(title)}</div>`;

/**
 * 현재 일차의 장소를 번호 순서대로 마커·경로선으로 보여주고, 목록에서 클릭한 장소로 이동한다.
 * 마커 객체는 렌더와 무관하므로 state 대신 ref 에 둔다.
 */
export function useKakaoMap(day: EditorDay | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const dayMarkers = useRef<any[]>([]);
  const polyline = useRef<any>(null);
  const focusMarker = useRef<{ marker: any; info: any } | null>(null);

  const init = useCallback(() => {
    const kakao = window.kakao;
    if (!kakao?.maps || !containerRef.current || map) return;
    kakao.maps.load(() => {
      setMap(
        new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: DEFAULT_LEVEL,
        }),
      );
    });
  }, [map]);

  const clearFocus = useCallback(() => {
    focusMarker.current?.info.close();
    focusMarker.current?.marker.setMap(null);
    focusMarker.current = null;
  }, []);

  useEffect(() => {
    const kakao = window.kakao;
    if (!map || !kakao) return;
    dayMarkers.current.forEach((m) => m.setMap(null));
    dayMarkers.current = [];
    polyline.current?.setMap(null);

    const points = (day?.slots ?? []).filter((p): p is NonNullable<typeof p> => !!p);
    if (points.length === 0) return;
    const bounds = new kakao.maps.LatLngBounds();
    const path: any[] = [];
    points.forEach((p, i) => {
      const pos = new kakao.maps.LatLng(p.mapY, p.mapX);
      const marker = new kakao.maps.Marker({ map, position: pos, title: `${i + 1}. ${p.title}` });
      const info = new kakao.maps.InfoWindow({ content: infoHtml(`${i + 1}. ${p.title}`) });
      kakao.maps.event.addListener(marker, "click", () => info.open(map, marker));
      dayMarkers.current.push(marker);
      bounds.extend(pos);
      path.push(pos);
    });
    polyline.current = new kakao.maps.Polyline({ map, path, strokeWeight: 3, strokeColor: "#2563eb", strokeOpacity: 0.7 });
    map.setBounds(bounds);
  }, [map, day]);

  const focus = useCallback(
    (p: MapPoint) => {
      const kakao = window.kakao;
      if (!map || !kakao) return;
      clearFocus();
      const pos = new kakao.maps.LatLng(p.mapY, p.mapX);
      map.setCenter(pos);
      map.setLevel(4);
      const marker = new kakao.maps.Marker({ map, position: pos, title: p.title });
      const info = new kakao.maps.InfoWindow({ content: infoHtml(p.title), removable: true });
      info.open(map, marker);
      focusMarker.current = { marker, info };
    },
    [map, clearFocus],
  );

  return { containerRef, ready: !!map, init, focus, clearFocus };
}
