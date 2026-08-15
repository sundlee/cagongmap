/**
 * 카카오맵 SDK 타입 선언 (전역).
 *
 * 공식 타입 패키지를 쓰지 않고 실제로 호출하는 API만 직접 선언한다.
 * 새 API를 쓰게 되면 여기에 추가할 것 — 없는 멤버를 any로 우회하지 말 것.
 *
 * 이 파일은 모듈이 아니다(import/export 없음). 전역 선언을 유지하기 위함이므로
 * import 구문을 추가하지 말 것.
 */

declare namespace kakao.maps {
  /** SDK를 autoload=false로 불러온 뒤 실제 초기화를 수행한다. */
  function load(callback: () => void): void;

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor();
    extend(latlng: LatLng): void;
    isEmpty(): boolean;
  }

  interface MapOptions {
    center: LatLng;
    /** 숫자가 작을수록 확대. 기본 3 */
    level?: number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    getCenter(): LatLng;
    setLevel(level: number): void;
    getLevel(): number;
    setBounds(bounds: LatLngBounds, paddingTop?: number): void;
    relayout(): void;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
    title?: string;
    clickable?: boolean;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
    position?: LatLng;
    removable?: boolean;
    zIndex?: number;
  }

  class InfoWindow {
    constructor(options?: InfoWindowOptions);
    open(map: Map, marker?: Marker): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
  }

  namespace event {
    function addListener(
      target: object,
      type: string,
      handler: (...args: never[]) => void,
    ): void;
    function removeListener(
      target: object,
      type: string,
      handler: (...args: never[]) => void,
    ): void;
  }
}

interface Window {
  kakao?: typeof kakao;
}
