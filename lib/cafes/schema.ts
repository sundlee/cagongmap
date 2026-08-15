import { z } from "zod";

/**
 * 카페 데이터 스키마.
 *
 * 정의는 `docs/data-schema.md`를 따른다. 문서를 고치면 이 파일도 함께 고칠 것.
 *
 * 필수는 식별 정보와 신뢰도 메타(`last_verified`, `verify_method`)뿐이다.
 * 나머지는 전부 optional인데, 현장 조사에서 모든 항목을 매번 확인할 수 있는 게
 * 아니기 때문이다. "모르는 값"은 추측해서 채우지 말고 비워둔다.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isoDate = z.string().regex(ISO_DATE, "YYYY-MM-DD 형식이어야 합니다");

export const dayOfWeek = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

/** 콘센트: 많음 / 일부 좌석만 / 거의 없음 */
export const powerLevel = z.enum(["many", "some", "few"]);
/** 좌석 종류: 1인석 / 4인 테이블 / 바 좌석 */
export const seatType = z.enum(["solo", "table4", "bar"]);
export const tableSize = z.enum(["wide", "normal", "narrow"]);
export const noiseLevel = z.enum(["quiet", "moderate", "loud"]);
export const musicVolume = z.enum(["low", "mid", "high"]);
export const wifiType = z.enum(["open", "password", "none"]);
export const studyPolicy = z.enum([
  "ok",
  "time_limited",
  "no_study_zone",
  "weekend_limited",
]);
/** 정책의 출처: 매장 안내문 / 직원 구두 확인 / 공식 SNS */
export const policySource = z.enum(["notice", "staff", "official_sns"]);
export const verifyMethod = z.enum(["visited", "called", "review_crosscheck"]);
export const restroom = z.enum(["inside", "outside", "shared"]);

export const cafeSchema = z
  .object({
    // 1. 식별·기본
    id: z.string().min(1),
    name: z.string().min(1),
    address: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    kakao_place_url: z.url().optional(),
    naver_place_url: z.url().optional(),
    // partialRecord를 쓰는 이유: z.record는 요일 7개를 전부 요구한다.
    // 평일 영업시간만 확인한 카페도 기록할 수 있어야 한다.
    hours: z.partialRecord(dayOfWeek, z.string()).optional(),
    closed_days: z.array(dayOfWeek).default([]),
    is_24h: z.boolean().default(false),
    americano_price: z.number().int().nonnegative().optional(),

    // 2. 작업 적합성
    power_level: powerLevel.optional(),
    power_note: z.string().optional(),
    seat_types: z.array(seatType).default([]),
    table_size: tableSize.optional(),
    noise_level: noiseLevel.optional(),
    music_volume: musicVolume.optional(),
    seat_count_approx: z.number().int().positive().optional(),
    wifi: wifiType.optional(),

    // 3. 정책
    study_policy: studyPolicy.optional(),
    policy_detail: z.string().optional(),
    policy_source: policySource.optional(),
    policy_verified_at: isoDate.optional(),

    // 4. 신뢰도 메타 (필수)
    last_verified: isoDate,
    verify_method: verifyMethod,
    source_note: z.string().optional(),
    photos: z.array(z.string()).default([]),

    // 5. 체감 정보
    busy_hours: z.string().optional(),
    restroom: restroom.optional(),
    laptop_friendliness_score: z.number().min(0).max(10).optional(),
  })
  /**
   * `docs/scope.md` 5-3의 원칙을 런타임에 강제한다.
   *
   * 카공 정책은 이 서비스에서 가장 가치 있는 데이터인 동시에, 틀렸을 때 실제
   * 매장에 영업 피해를 주는 유일한 필드다. 그래서 매장 안내문이나 직원 확인 같은
   * 1차 출처가 없으면 아예 기록하지 못하게 막는다. 블로그·리뷰에서 본 정책은
   * 근거로 인정하지 않는다.
   */
  .refine(
    (cafe) =>
      cafe.study_policy === undefined ||
      cafe.policy_source === "notice" ||
      cafe.policy_source === "staff",
    {
      message:
        "study_policy는 policy_source가 'notice'(매장 안내문) 또는 'staff'(직원 확인)일 때만 기록할 수 있습니다",
      path: ["study_policy"],
    },
  );

export const cafesFileSchema = z.object({
  _note: z.string().optional(),
  cafes: z.array(cafeSchema),
});

export type Cafe = z.infer<typeof cafeSchema>;
export type DayOfWeek = z.infer<typeof dayOfWeek>;
export type PowerLevel = z.infer<typeof powerLevel>;
export type SeatType = z.infer<typeof seatType>;
export type TableSize = z.infer<typeof tableSize>;
export type NoiseLevel = z.infer<typeof noiseLevel>;
export type MusicVolume = z.infer<typeof musicVolume>;
export type WifiType = z.infer<typeof wifiType>;
export type StudyPolicy = z.infer<typeof studyPolicy>;
export type PolicySource = z.infer<typeof policySource>;
export type VerifyMethod = z.infer<typeof verifyMethod>;
export type Restroom = z.infer<typeof restroom>;
