import type {
  DayOfWeek,
  MusicVolume,
  NoiseLevel,
  PolicySource,
  PowerLevel,
  Restroom,
  SeatType,
  StudyPolicy,
  TableSize,
  VerifyMethod,
  WifiType,
} from "./schema";

/**
 * enum 값 → 화면에 보여줄 한글 라벨.
 *
 * Record<Enum, string>으로 선언해서 스키마에 값을 추가하면 여기서 타입 에러가
 * 나도록 한다. 라벨 없는 값이 화면에 raw로 새는 걸 막기 위함.
 */

export const DAY_LABEL: Record<DayOfWeek, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

export const DAY_ORDER: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const POWER_LEVEL_LABEL: Record<PowerLevel, string> = {
  many: "많음",
  some: "일부 좌석만",
  few: "거의 없음",
};

export const SEAT_TYPE_LABEL: Record<SeatType, string> = {
  solo: "1인석",
  table4: "4인 테이블",
  bar: "바 좌석",
};

export const TABLE_SIZE_LABEL: Record<TableSize, string> = {
  wide: "넓음",
  normal: "보통",
  narrow: "좁음",
};

export const NOISE_LEVEL_LABEL: Record<NoiseLevel, string> = {
  quiet: "조용함",
  moderate: "적당한 백색소음",
  loud: "시끄러움",
};

export const MUSIC_VOLUME_LABEL: Record<MusicVolume, string> = {
  low: "작음",
  mid: "보통",
  high: "큼",
};

export const WIFI_LABEL: Record<WifiType, string> = {
  open: "있음 (비밀번호 없음)",
  password: "있음 (비밀번호 필요)",
  none: "없음",
};

export const STUDY_POLICY_LABEL: Record<StudyPolicy, string> = {
  ok: "자유",
  time_limited: "시간 제한 있음",
  no_study_zone: "노트북 사용 불가",
  weekend_limited: "주말만 제한",
};

export const POLICY_SOURCE_LABEL: Record<PolicySource, string> = {
  notice: "매장 안내문",
  staff: "직원 확인",
  official_sns: "공식 SNS",
};

export const VERIFY_METHOD_LABEL: Record<VerifyMethod, string> = {
  visited: "직접 방문",
  called: "전화 확인",
  review_crosscheck: "리뷰 교차확인",
};

export const RESTROOM_LABEL: Record<Restroom, string> = {
  inside: "매장 내부",
  outside: "외부",
  shared: "건물 공용",
};
