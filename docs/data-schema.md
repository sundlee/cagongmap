# 카페 데이터 스키마

- 작성일: 2026-08-15
- 저장 위치: `data/cafes.json` (단일 파일, 백엔드 없음)
- 관련 문서: `docs/scope.md`

---

## 조사 방식 표기

★ 표시 필드는 **직접 방문해야만 알 수 있는 항목**이다. 조사 비용 산정의 기준이 되며,
비용을 줄여야 할 경우 여기가 아니라 카페 개수를 줄인다 (`docs/scope.md` 5-2).

---

## 1. 식별·기본

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 고유 식별자 (kebab-case) |
| `name` | string | 매장명 |
| `address` | string | 도로명 주소 |
| `lat` / `lng` | number | 좌표 |
| `kakao_place_url` | string? | 카카오맵 장소 링크 |
| `naver_place_url` | string? | 네이버 플레이스 링크 |
| `hours` | object | 요일별 영업시간 |
| `closed_days` | string[] | 휴무일 |
| `is_24h` | boolean | 24시간 운영 여부 |
| `americano_price` | number? | 아메리카노 가격 (원) |

## 2. 작업 적합성 — 핵심 차별 데이터

| 필드 | 타입 | 값 / 설명 |
|---|---|---|
| ★ `power_level` | enum | `many` / `some` / `few` |
| ★ `power_note` | string? | 예: "벽면·창가 좌석에만, 중앙 테이블 없음" |
| ★ `seat_types` | string[] | `solo` / `table4` / `bar` |
| ★ `table_size` | enum | `wide` / `normal` / `narrow` |
| ★ `noise_level` | enum | `quiet` / `moderate` / `loud` |
| ★ `music_volume` | enum? | `low` / `mid` / `high` |
| ★ `seat_count_approx` | number? | 대략적인 좌석 수 |
| `wifi` | enum | `open` / `password` / `none` — **속도는 측정하지 않음 (범위 밖)** |

## 3. 정책 — 가장 가치 높고 가장 위험한 데이터

| 필드 | 타입 | 값 / 설명 |
|---|---|---|
| `study_policy` | enum? | `ok` / `time_limited` / `no_study_zone` / `weekend_limited` |
| `policy_detail` | string? | 원문 그대로. 예: "주말 4시간 제한, 매장 안내문 기준" |
| `policy_source` | enum? | `notice` (매장 안내문) / `staff` (직원 구두) / `official_sns` |
| `policy_verified_at` | date? | 정책 확인일 |

> **원칙:** `policy_source`가 `notice` 또는 `staff`가 아니면 `study_policy`를 **비워둔다.**
> 잘못된 노스터디존 표기는 실제 매장에 영업 피해를 준다 (`docs/scope.md` 5-3).

## 4. 신뢰도 메타 — 모든 항목 필수

| 필드 | 타입 | 설명 |
|---|---|---|
| `last_verified` | date | `YYYY-MM-DD`. **UI에 항상 노출** |
| `verify_method` | enum | `visited` / `called` / `review_crosscheck` |
| `source_note` | string? | 확인 경위 메모 |
| `photos` | string[] | **본인 촬영분만** |

> 90일 경과 시 UI에서 "정보 오래됨" 배지를 자동 표시한다.

## 5. 체감 정보 (선택)

| 필드 | 타입 | 설명 |
|---|---|---|
| ★ `busy_hours` | string? | 붐비는 시간대 메모 |
| `restroom` | enum? | `inside` / `outside` / `shared` |
| `laptop_friendliness_score` | number | 위 항목들로 계산. 정렬용. **산식을 사이트에 공개한다** |

---

## 예시

```json
{
  "id": "example-cafe-seongsu",
  "name": "예시카페 성수점",
  "address": "서울 성동구 연무장길 00",
  "lat": 37.5445,
  "lng": 127.0557,
  "kakao_place_url": "https://place.map.kakao.com/000000000",
  "hours": { "mon": "09:00-22:00", "sat": "10:00-22:00" },
  "closed_days": ["sun"],
  "is_24h": false,
  "americano_price": 4500,

  "power_level": "some",
  "power_note": "벽면·창가 좌석에만. 중앙 대형 테이블에는 없음",
  "seat_types": ["solo", "table4"],
  "table_size": "wide",
  "noise_level": "moderate",
  "music_volume": "mid",
  "seat_count_approx": 34,
  "wifi": "password",

  "study_policy": "time_limited",
  "policy_detail": "주말 4시간 제한 (매장 입구 안내문)",
  "policy_source": "notice",
  "policy_verified_at": "2026-08-14",

  "last_verified": "2026-08-14",
  "verify_method": "visited",
  "source_note": "평일 14시 방문, 콘센트 직접 확인",
  "photos": ["/photos/example-cafe-seongsu-1.jpg"],

  "busy_hours": "평일 15~18시 만석",
  "restroom": "inside",
  "laptop_friendliness_score": 7.5
}
```

---

## 필터 매핑

사이트 필터가 어떤 필드를 읽는지:

| 필터 | 사용 필드 |
|---|---|
| 콘센트 등급 | `power_level` |
| 카공 정책 | `study_policy` |
| 소음 | `noise_level` |
| 1인석·넓은 테이블 | `seat_types`, `table_size` |
| 지금 영업 중 | `hours`, `closed_days`, `is_24h` |
| 22시 이후 영업 | `hours`, `is_24h` |
