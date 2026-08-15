"use client";

import { useEffect, useRef } from "react";
import type { Cafe } from "@/lib/cafes/schema";

/**
 * 카페 목록을 지도 위 마커로 그린다.
 *
 * 카카오 마커는 React 엘리먼트가 아니라 명령형 객체라서 DOM을 반환하지 않는다.
 * 대신 map 인스턴스를 prop으로 받아 마커의 생성·제거만 이 컴포넌트가 책임진다.
 */
export default function CafeMarkers({
  map,
  cafes,
  onSelect,
}: {
  map: kakao.maps.Map;
  cafes: Cafe[];
  onSelect: (cafeId: string | null) => void;
}) {
  // 콜백을 ref로 받는 이유: onSelect를 의존성에 넣으면 선택이 바뀔 때마다
  // 마커를 전부 다시 만들고 setBounds가 재실행돼 지도가 원래 위치로 튄다.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    const maps = window.kakao?.maps;
    if (!maps) return;

    const bounds = new maps.LatLngBounds();

    const markers = cafes.map((cafe) => {
      const position = new maps.LatLng(cafe.lat, cafe.lng);
      bounds.extend(position);

      const marker = new maps.Marker({
        position,
        map,
        title: cafe.name,
      });

      maps.event.addListener(marker, "click", () => {
        onSelectRef.current(cafe.id);
      });

      return marker;
    });

    // 빈 곳을 누르면 패널을 닫는다.
    const closeOnMapClick = () => onSelectRef.current(null);
    maps.event.addListener(map, "click", closeOnMapClick);

    // 마커가 전부 보이도록 화면을 맞춘다.
    if (!bounds.isEmpty()) {
      map.setBounds(bounds);
    }

    return () => {
      maps.event.removeListener(map, "click", closeOnMapClick);
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [map, cafes]);

  return null;
}
