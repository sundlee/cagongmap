"use client";

import { useEffect } from "react";
import {
  daysSinceVerified,
  isStale,
} from "@/lib/cafes/freshness";
import {
  DAY_LABEL,
  DAY_ORDER,
  MUSIC_VOLUME_LABEL,
  NOISE_LEVEL_LABEL,
  POLICY_SOURCE_LABEL,
  POWER_LEVEL_LABEL,
  RESTROOM_LABEL,
  SEAT_TYPE_LABEL,
  STUDY_POLICY_LABEL,
  TABLE_SIZE_LABEL,
  VERIFY_METHOD_LABEL,
  WIFI_LABEL,
} from "@/lib/cafes/labels";
import type { Cafe, DayOfWeek } from "@/lib/cafes/schema";

type Field = readonly [label: string, value: string | null | undefined];

export default function CafeDetailPanel({
  cafe,
  onClose,
}: {
  cafe: Cafe;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const workFields: Field[] = [
    [
      "콘센트",
      cafe.power_level
        ? POWER_LEVEL_LABEL[cafe.power_level] +
          (cafe.power_note ? ` — ${cafe.power_note}` : "")
        : null,
    ],
    ["소음", cafe.noise_level ? NOISE_LEVEL_LABEL[cafe.noise_level] : null],
    ["음악", cafe.music_volume ? MUSIC_VOLUME_LABEL[cafe.music_volume] : null],
    ["와이파이", cafe.wifi ? WIFI_LABEL[cafe.wifi] : null],
    ["테이블", cafe.table_size ? TABLE_SIZE_LABEL[cafe.table_size] : null],
    [
      "좌석",
      cafe.seat_types.length
        ? cafe.seat_types.map((type) => SEAT_TYPE_LABEL[type]).join(", ")
        : null,
    ],
    [
      "좌석 수",
      cafe.seat_count_approx ? `약 ${cafe.seat_count_approx}석` : null,
    ],
  ];

  const visitFields: Field[] = [
    ["영업시간", cafe.is_24h ? "24시간" : formatHours(cafe.hours)],
    [
      "휴무",
      cafe.closed_days.length
        ? `${cafe.closed_days.map((day) => DAY_LABEL[day]).join("·")}요일`
        : null,
    ],
    [
      "아메리카노",
      cafe.americano_price ? `${cafe.americano_price.toLocaleString()}원` : null,
    ],
    ["혼잡", cafe.busy_hours],
    ["화장실", cafe.restroom ? RESTROOM_LABEL[cafe.restroom] : null],
  ];

  const links: Field[] = [
    ["카카오맵", cafe.kakao_place_url],
    ["네이버", cafe.naver_place_url],
  ];

  return (
    <aside
      aria-label={`${cafe.name} 상세 정보`}
      className="absolute inset-x-0 bottom-0 z-10 max-h-[65svh] overflow-y-auto rounded-t-xl bg-white shadow-[0_-2px_16px_rgba(0,0,0,0.12)] sm:inset-y-4 sm:right-auto sm:left-4 sm:w-[360px] sm:max-h-none sm:rounded-xl sm:shadow-[0_2px_16px_rgba(0,0,0,0.12)]"
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="text-lg leading-tight font-semibold">{cafe.name}</h2>
          <p className="mt-1 text-sm text-neutral-500">{cafe.address}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="-mt-1 -mr-1 shrink-0 rounded p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          ✕
        </button>
      </header>

      <VerificationBlock cafe={cafe} />

      <PolicyBlock cafe={cafe} />

      <Section title="작업 적합성" fields={workFields} />
      <Section title="영업 정보" fields={visitFields} />
      <Section title="원본 정보" fields={links} isLink />
    </aside>
  );
}

/**
 * 확인일과 확인 방법을 상세의 최상단에 둔다.
 * `docs/scope.md` 3.1 — 이 서비스의 차별점이 정보의 최신성이라, 신뢰도 메타는
 * 부가 정보가 아니라 1급 정보로 다룬다.
 */
function VerificationBlock({ cafe }: { cafe: Cafe }) {
  const stale = isStale(cafe.last_verified);
  const days = daysSinceVerified(cafe.last_verified);
  const elapsed = days === null ? null : days === 0 ? "오늘" : `${days}일 전`;

  return (
    <div
      className={`mx-4 mb-3 rounded-lg px-3 py-2.5 ${
        stale ? "bg-amber-50" : "bg-neutral-100"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
            stale ? "bg-amber-200 text-amber-900" : "bg-neutral-200 text-neutral-700"
          }`}
        >
          {stale ? "정보 오래됨" : "확인됨"}
        </span>
        <span className="text-sm text-neutral-700">
          {cafe.last_verified}
          {elapsed ? ` (${elapsed})` : ""}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-neutral-600">
        확인 방법: {VERIFY_METHOD_LABEL[cafe.verify_method]}
      </p>
      {cafe.source_note && (
        <p className="mt-1 text-xs text-neutral-600">{cafe.source_note}</p>
      )}
    </div>
  );
}

/**
 * 정책은 값이 없을 때도 반드시 렌더한다.
 * 빈 값이 "제한 없음"으로 읽히면 사용자가 헛걸음하고, 반대로 잘못 표기하면
 * 매장이 피해를 본다. 그래서 "모른다"를 명시적으로 말한다.
 */
function PolicyBlock({ cafe }: { cafe: Cafe }) {
  return (
    <section className="border-t border-neutral-200 px-4 py-3">
      <h3 className="mb-1.5 text-xs font-semibold text-neutral-500">카공 정책</h3>

      {cafe.study_policy ? (
        <>
          <p className="text-sm font-medium text-neutral-900">
            {STUDY_POLICY_LABEL[cafe.study_policy]}
          </p>
          {cafe.policy_detail && (
            <p className="mt-1 text-sm text-neutral-700">{cafe.policy_detail}</p>
          )}
          {cafe.policy_source && (
            <p className="mt-1.5 text-xs text-neutral-500">
              출처: {POLICY_SOURCE_LABEL[cafe.policy_source]}
              {cafe.policy_verified_at ? ` · ${cafe.policy_verified_at} 확인` : ""}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-neutral-500">
          확인된 정책 정보가 없습니다. 제한이 없다는 뜻은 아닙니다.
        </p>
      )}
    </section>
  );
}

function Section({
  title,
  fields,
  isLink = false,
}: {
  title: string;
  fields: Field[];
  isLink?: boolean;
}) {
  const visible = fields.filter((field): field is [string, string] =>
    Boolean(field[1]),
  );
  if (visible.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 px-4 py-3">
      <h3 className="mb-1.5 text-xs font-semibold text-neutral-500">{title}</h3>
      <dl>
        {visible.map(([label, value]) => (
          <div key={label} className="flex gap-3 py-0.5 text-sm">
            <dt className="w-16 shrink-0 text-neutral-500">{label}</dt>
            <dd className="min-w-0 flex-1 whitespace-pre-line text-neutral-900">
              {isLink ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-blue-600 underline underline-offset-2"
                >
                  바로가기
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * 요일별 영업시간을 "월~금 09:00-22:00" 형태로 접는다.
 * 요일이 실제로 연속일 때만 묶는다 — 월·수만 있는데 "월~수"로 보이면 안 된다.
 */
function formatHours(
  hours: Partial<Record<DayOfWeek, string>> | undefined,
): string | null {
  if (!hours) return null;

  const groups: { days: DayOfWeek[]; time: string; lastIndex: number }[] = [];

  DAY_ORDER.forEach((day, index) => {
    const time = hours[day];
    if (!time) return;

    const current = groups.at(-1);
    if (current && current.time === time && current.lastIndex === index - 1) {
      current.days.push(day);
      current.lastIndex = index;
      return;
    }
    groups.push({ days: [day], time, lastIndex: index });
  });

  if (groups.length === 0) return null;

  return groups
    .map(({ days, time }) => {
      const label =
        days.length >= 3
          ? `${DAY_LABEL[days[0]]}~${DAY_LABEL[days[days.length - 1]]}`
          : days.map((day) => DAY_LABEL[day]).join("·");
      return `${label} ${time}`;
    })
    .join("\n");
}
