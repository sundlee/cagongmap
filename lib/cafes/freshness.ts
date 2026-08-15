/**
 * 데이터 신선도 판정.
 *
 * `docs/scope.md` 3.5: 90일 지난 항목은 "정보 오래됨"으로 표시한다.
 * 이 서비스가 네이버·카카오 대비 내세울 수 있는 게 정보의 최신성뿐이라,
 * 오래된 데이터를 오래됐다고 말하는 것 자체가 기능이다.
 */

export const STALE_AFTER_DAYS = 90;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** last_verified(YYYY-MM-DD)로부터 지난 일수. 파싱 실패 시 null. */
export function daysSinceVerified(
  lastVerified: string,
  now: Date = new Date(),
): number | null {
  const verified = Date.parse(`${lastVerified}T00:00:00Z`);
  if (Number.isNaN(verified)) return null;

  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  return Math.floor((today - verified) / MS_PER_DAY);
}

export function isStale(lastVerified: string, now: Date = new Date()): boolean {
  const days = daysSinceVerified(lastVerified, now);
  // 판정할 수 없으면 신선하다고 우기지 않는다.
  if (days === null) return true;
  return days > STALE_AFTER_DAYS;
}
