import type { NoiseLevel, OutletLevel, WorkFit } from "./schema";

/**
 * enum 값 → 화면에 보여줄 한글 라벨.
 *
 * `Record<Enum, string>`을 강제해 스키마에 값이 추가되면 여기서 컴파일 에러가
 * 나게 한다. 라벨 없는 값이 화면에 raw로 새는 것을 막기 위함.
 */

export const OUTLET_LABEL: Record<OutletLevel, string> = {
  many: "콘센트 많음",
  some: "일부 좌석만",
  few: "거의 없음",
};

export const NOISE_LABEL: Record<NoiseLevel, string> = {
  quiet: "조용함",
  normal: "보통",
  loud: "시끄러움",
};

export const WORK_FIT_LABEL: Record<WorkFit, string> = {
  good: "작업하기 좋음",
  ok: "무난함",
  bad: "작업 비추천",
};
