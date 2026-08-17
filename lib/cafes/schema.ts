import { z } from "zod";

/**
 * data/cafes.json의 데이터 계약. 현재 수집된 데이터의 필드를 그대로 따른다.
 *
 * `docs/data-schema.md`의 장기 스키마(power_level, last_verified 등)와는 다르다 —
 * 이관은 현장 조사 데이터가 생기는 다음 단계에서 진행한다. 그때까지 이 파일이
 * 유일한 계약이며, 문서와 코드 중 코드가 우선한다.
 *
 * 원칙(계승): 식별 정보 외에 모르는 값을 추측으로 채우지 않는다.
 */

/** "HH:MM" 24시간제. 자정 마감은 "00:00"으로 적는다. */
const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM 형식이어야 합니다");

export const outletLevelSchema = z.enum(["many", "some", "few"]);
export const noiseLevelSchema = z.enum(["quiet", "normal", "loud"]);
export const workFitSchema = z.enum(["good", "ok", "bad"]);

export const cafeSchema = z.object({
  // 식별·기본. id는 URL 공유에 쓰일 값이므로 ascii kebab-case로 한 번 정하면 바꾸지 않는다.
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  naver_place_url: z.url().optional(),
  open_time: timeOfDay,
  close_time: timeOfDay,
  is_24h: z.boolean(),
  iced_americano_price: z.number().int().nonnegative().optional(),

  // 작업 적합성 — 이 서비스의 핵심 차별 데이터
  outlet: outletLevelSchema,
  wifi: z.boolean(),
  noise: noiseLevelSchema,
  work_fit: workFitSchema,
  tags: z.array(z.string()).default([]),
});

/**
 * 최상위는 배열 하나. 손으로 편집하는 파일이라 항목 복붙 시 id가 겹치는
 * 실수가 실제로 일어날 수 있어, 중복을 여기서 걸러낸다.
 */
export const cafesFileSchema = z.array(cafeSchema).superRefine((cafes, ctx) => {
  const seen = new Set<string>();
  cafes.forEach((cafe, index) => {
    if (seen.has(cafe.id)) {
      ctx.addIssue({
        code: "custom",
        path: [index, "id"],
        message: `중복된 id: ${cafe.id}`,
      });
    }
    seen.add(cafe.id);
  });
});

export type Cafe = z.infer<typeof cafeSchema>;
export type OutletLevel = z.infer<typeof outletLevelSchema>;
export type NoiseLevel = z.infer<typeof noiseLevelSchema>;
export type WorkFit = z.infer<typeof workFitSchema>;
