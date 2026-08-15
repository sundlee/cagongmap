/**
 * 카카오맵 SDK 로드 단일 진입점.
 *
 * 컴포넌트에서 <script>를 직접 붙이지 않는다. React StrictMode의 이중 마운트나
 * 지도 컴포넌트가 여러 개 뜨는 경우에 SDK가 중복 로드되기 때문에, 로드 Promise를
 * 모듈 스코프에 하나만 두고 공유한다.
 */

const SCRIPT_ID = "kakao-maps-sdk";

/**
 * NEXT_PUBLIC_ 접두사가 붙은 값은 빌드 시점에 인라인되므로 반드시 정적으로
 * 참조해야 한다 (process.env[key] 형태로 접근하면 치환되지 않는다).
 */
export const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

type KakaoNamespace = typeof kakao;

let loadPromise: Promise<KakaoNamespace> | null = null;

function sdkUrl(appKey: string): string {
  // autoload=false로 받아서 kakao.maps.load()로 초기화 시점을 직접 제어한다.
  return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
}

export function loadKakaoMaps(appKey: string): Promise<KakaoNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("loadKakaoMaps는 브라우저에서만 호출할 수 있습니다"),
    );
  }

  if (!appKey) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_KAKAO_MAP_KEY가 비어 있습니다"),
    );
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise<KakaoNamespace>((resolve, reject) => {
    const fail = (message: string) => {
      // 실패한 Promise를 캐시해두면 재시도가 영원히 막힌다.
      loadPromise = null;
      reject(new Error(message));
    };

    const onScriptLoad = () => {
      // 스크립트 응답은 200이지만 인증에 실패하면 kakao 전역이 만들어지지 않는다.
      // 도메인 미등록이 이 경로로 들어온다.
      if (!window.kakao?.maps) {
        fail(
          "SDK는 받았지만 초기화되지 않았습니다. 카카오 개발자 콘솔에서 현재 도메인이 등록되어 있는지 확인하세요.",
        );
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao as KakaoNamespace));
    };

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      if (window.kakao?.maps) {
        onScriptLoad();
      } else {
        existing.addEventListener("load", onScriptLoad, { once: true });
        existing.addEventListener(
          "error",
          () => fail("카카오맵 SDK를 불러오지 못했습니다"),
          { once: true },
        );
      }
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = sdkUrl(appKey);
    script.addEventListener("load", onScriptLoad, { once: true });
    script.addEventListener(
      "error",
      () => {
        script.remove();
        fail(
          "카카오맵 SDK를 불러오지 못했습니다. 앱 키가 올바른지, 네트워크가 정상인지 확인하세요.",
        );
      },
      { once: true },
    );

    document.head.appendChild(script);
  });

  return loadPromise;
}
