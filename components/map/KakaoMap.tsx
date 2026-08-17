"use client";

import { useEffect, useRef, useState } from "react";
import type { Cafe } from "@/lib/cafes/schema";
import { KAKAO_APP_KEY, loadKakaoMaps } from "@/lib/kakao/loader";
import CafeMarkers from "./CafeMarkers";

/** 석촌호수 부근(송파·잠실 상권). 마커가 있으면 CafeMarkers가 bounds로 다시 맞춘다. */
const DEFAULT_CENTER = { lat: 37.5085, lng: 127.0817 };

type Status = "loading" | "ready" | "error";

export default function KakaoMap({ cafes }: { cafes: Cafe[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCafe = cafes.find((cafe) => cafe.id === selectedId) ?? null;

  useEffect(() => {
    if (!KAKAO_APP_KEY) return;

    let cancelled = false;

    loadKakaoMaps(KAKAO_APP_KEY)
      .then((kakao) => {
        if (cancelled || !containerRef.current) return;

        setMap(
          new kakao.maps.Map(containerRef.current, {
            center: new kakao.maps.LatLng(
              DEFAULT_CENTER.lat,
              DEFAULT_CENTER.lng,
            ),
            level: 6,
          }),
        );
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!KAKAO_APP_KEY) return <SetupNotice />;

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {status === "loading" && (
        <Overlay>
          <p className="text-sm text-neutral-500">지도를 불러오는 중…</p>
        </Overlay>
      )}

      {status === "error" && (
        <Overlay>
          <div className="max-w-md space-y-2 text-center">
            <p className="text-sm font-medium">지도를 표시할 수 없습니다</p>
            <p className="text-sm text-neutral-500">{errorMessage}</p>
          </div>
        </Overlay>
      )}

      {map && (
        <CafeMarkers map={map} cafes={cafes} onSelect={setSelectedId} />
      )}

      {/* 상세 패널(다음 단계)이 들어올 자리. 지금은 마커 클릭이 동작하는지
          확인할 수 있게 선택된 카페 이름만 최소로 표시한다. */}
      {selectedCafe && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-sm">
          <p className="text-sm font-medium">{selectedCafe.name}</p>
        </div>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 p-6">
      {children}
    </div>
  );
}

/**
 * 앱 키가 없으면 지도 대신 설정 안내를 띄운다.
 * 키 없이 clone한 사람이 빈 회색 화면을 보고 원인을 추측하게 두지 않기 위함.
 */
function SetupNotice() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md space-y-3 text-sm">
        <p className="font-medium">카카오맵 앱 키가 설정되지 않았습니다</p>
        <ol className="list-decimal space-y-1 pl-5 text-neutral-600">
          <li>
            <code className="rounded bg-neutral-200 px-1">.env.local.example</code>
            을 <code className="rounded bg-neutral-200 px-1">.env.local</code>로
            복사합니다
          </li>
          <li>
            카카오 개발자 콘솔에서 발급한 <strong>JavaScript 키</strong>를{" "}
            <code className="rounded bg-neutral-200 px-1">
              NEXT_PUBLIC_KAKAO_MAP_KEY
            </code>
            에 넣습니다
          </li>
          <li>
            같은 콘솔의 <strong>앱 설정 → 플랫폼 → Web</strong>에{" "}
            <code className="rounded bg-neutral-200 px-1">
              http://localhost:3030
            </code>
            을 등록합니다
          </li>
          <li>개발 서버를 재시작합니다</li>
        </ol>
      </div>
    </div>
  );
}
