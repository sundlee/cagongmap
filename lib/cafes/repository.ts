import { getSupabase } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { cafesFileSchema, type Cafe } from "./schema";

/**
 * 카페 데이터 접근의 단일 경계 — 데이터 소스는 Supabase `places` 테이블.
 *
 * 예고했던 JSON → DB 전환은 이 파일 안에서만 일어났고, 호출부와 시그니처는
 * 그대로다. `data/cafes.json`은 더 이상 앱이 읽지 않는다 — 시드 마이그레이션
 * (supabase/migrations)의 원본 기록으로만 남는다.
 *
 * DB 응답도 기존과 같은 zod 스키마로 파싱한다(이중 검증). DB 제약과 코드
 * 계약이 어긋나면 조용히 넘어가지 않고 여기서 즉시 실패시키기 위함이다.
 *
 * 쓰기(제보 등록/수정)도 나중에 여기에 추가한다.
 */

/** 코드 계약(schema.ts)이 요구하는 컬럼만 가져온다. 신뢰도 메타는 아직 UI가 없다. */
const PLACE_COLUMNS =
  "slug, name, address, lat, lng, naver_place_url, open_time, close_time, is_24h, iced_americano_price, outlet, wifi, noise, work_fit, tags" as const;

type PlaceRow = Pick<
  Tables<"places">,
  | "slug"
  | "name"
  | "address"
  | "lat"
  | "lng"
  | "naver_place_url"
  | "open_time"
  | "close_time"
  | "is_24h"
  | "iced_americano_price"
  | "outlet"
  | "wifi"
  | "noise"
  | "work_fit"
  | "tags"
>;

/**
 * Postgres `time`은 "HH:MM:SS"로 온다 — 코드 계약은 "HH:MM".
 * DB는 24시간 영업이면 null을 허용하지만(hours_present 제약) 코드 계약은 항상
 * 문자열을 요구하므로, null이면 빈 문자열로 두어 아래 zod 검증이 즉시 실패하게 한다.
 */
function toHHMM(value: string | null): string {
  return value?.slice(0, 5) ?? "";
}

function toCafe(row: PlaceRow): Cafe {
  return {
    id: row.slug, // URL 공유용 안정 식별자는 slug가 승계했다 (uuid는 내부 전용)
    name: row.name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    naver_place_url: row.naver_place_url ?? undefined,
    open_time: toHHMM(row.open_time),
    close_time: toHHMM(row.close_time),
    is_24h: row.is_24h,
    iced_americano_price: row.iced_americano_price ?? undefined,
    outlet: row.outlet,
    wifi: row.wifi,
    noise: row.noise,
    work_fit: row.work_fit,
    tags: row.tags,
  };
}

async function fetchAll(): Promise<Cafe[]> {
  const { data, error } = await getSupabase()
    .from("places")
    .select(PLACE_COLUMNS)
    // RLS(places_public_read)도 같은 조건으로 거르지만, 나중에 service role 키로
    // 바꿔도 내려진 매장이 새어 나가지 않도록 조회 쪽에도 명시한다.
    .eq("is_visible", true)
    .order("slug");

  if (error) {
    throw new Error(`Supabase places 조회 실패: ${error.message}`);
  }

  const parsed = cafesFileSchema.safeParse(data.map(toCafe));

  if (!parsed.success) {
    throw new Error(
      `places 데이터 검증 실패:\n${JSON.stringify(parsed.error.issues, null, 2)}`,
    );
  }

  return parsed.data;
}

/**
 * 프로세스당 1회만 조회한다. 프로덕션 빌드에서는 빌드 타임에 한 번 실행되어
 * 데이터가 페이지에 박제되고(기존 JSON과 같은 동작), dev에서는 요청마다
 * 재조회하지 않기 위한 캐시다. DB를 고친 뒤에는 dev 서버를 재시작할 것.
 */
let cache: Promise<Cafe[]> | null = null;

export async function getCafes(): Promise<Cafe[]> {
  // 실패한 Promise를 캐시에 남기면 일시적 네트워크 오류가 영구화되므로 비운다.
  cache ??= fetchAll().catch((error: unknown) => {
    cache = null;
    throw error;
  });
  return cache;
}

export async function getCafeById(id: string): Promise<Cafe | null> {
  return (await getCafes()).find((cafe) => cafe.id === id) ?? null;
}
