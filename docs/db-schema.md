# 카공맵 DB 스키마 초안 — Supabase/Postgres

- 작성일: 2026-08-17 · 개정: 2026-08-17 (v2)
- 상태: **초안** (제보 단계 대비 설계. 1단계 구현을 바꾸지 않는다)
- 관련 문서: `docs/scope.md`(범위), `docs/data-schema.md`(장기 JSON 스키마), `lib/cafes/schema.ts`(현행 코드 계약)
- 구현 현황: 1단계 분량(places + 시드 9곳)은 **적용 완료** (2026-08-17, Supabase 프로젝트 `cagongmap`). SQL은 `supabase/migrations/`에 원격 마이그레이션 버전과 같은 이름으로 보관.
  - `20260817093657_create_places_schema.sql`
  - `20260817093736_seed_places_from_cafes_json.sql`

v2 변경점: ① 테이블명 `cafes` → **`places`** 확정(사용자 지정, 파생 이름도 일괄 개명), ② `place_submissions.submitted_by`의 `not null` + `on delete set null` 모순 수정, ③ `profiles.role` 자가 승격 차단을 정책 메모에서 컬럼 권한(DDL)으로 격상, ④ 함수에 `search_path` 고정(Supabase lint).

---

## 0. 전제

- 1단계는 `docs/scope.md`대로 정적 `data/cafes.json`을 유지한다. 이 문서는 **제보(크라우드소싱) 단계로 넘어갈 때** 쓸 설계다.
- 전환 지점은 `lib/cafes/repository.ts` 하나다. 이미 async 시그니처이므로 `getCafes()` 내부를 Supabase 조회로 바꾸면 호출부는 그대로다.
- 기본 필드는 현행 `data/cafes.json`을 따른다 (`outlet`/`noise`/`work_fit`/`tags` 어휘). `docs/data-schema.md`의 장기 필드는 5장에 확장 경로로만 적는다.
- 원칙 계승: **공개 데이터(`places`)에는 검증된 것만 들어간다.** 제보는 별도 테이블(`place_submissions`)에 쌓이고, 승인을 거쳐야 `places`에 반영된다. 자동 반영 없음 — 잘못된 노스터디존 표기가 매장에 피해를 주는 문제(scope.md 5-3) 때문에 사람이 반드시 개입한다.

## 1. 전체 그림

```
auth.users (Supabase 관리)
    │ 1:1 (가입 트리거로 생성)
profiles                     역할(user/moderator) 보관 — RLS 판정용
    │
    │ submitted_by / reviewed_by
place_submissions            제보 인박스: 신규 장소 or 정정. pending → approved/rejected
    │ 승인 시 서버(service role)가 payload를 반영
    ▼
places                       공개 데이터. 익명 읽기 전용. 쓰기는 서버만
```

- 읽기 경로(지도)는 `places` 단일 테이블 조회. 조인 없음 — 100곳 규모에서 단순함이 우선.
- 쓰기 경로(제보)는 `place_submissions`에만 insert. `places`에는 클라이언트가 직접 쓸 수 없다.
- 구현 순서: **1단계 마이그레이션은 `places`(+enum, 트리거, RLS)만 만든다.** `profiles`/`place_submissions`와 moderator 정책은 제보 단계 마이그레이션에서 추가한다.

## 2. DDL

### 2.1 enum 타입

`lib/cafes/schema.ts`의 zod enum과 1:1. Supabase 타입 생성(`supabase gen types`)이 Postgres enum을 TS 유니언으로 뽑아주므로 zod 어휘와 어긋나지 않게 유지한다.

```sql
create type outlet_level   as enum ('many', 'some', 'few');
create type noise_level    as enum ('quiet', 'normal', 'loud');
create type work_fit_level as enum ('good', 'ok', 'bad');

-- docs/data-schema.md의 3종 + 'report'.
-- 'report' = 제보로 갱신됐고 운영자가 독립 재확인은 안 한 상태.
-- "어떻게 확인했는지 항상 노출"이 차별점이므로 이 상태도 정직하게 구분한다.
create type verify_method as enum ('visited', 'called', 'review_crosscheck', 'report');

-- 제보 단계에서 추가
create type submission_type   as enum ('new_place', 'correction');
create type submission_status as enum ('pending', 'approved', 'rejected');
```

### 2.2 `places` — 공개 장소 데이터

```sql
create table public.places (
  id   uuid primary key default gen_random_uuid(),
  -- URL 공유용 안정 식별자. 현행 cafes.json의 id를 그대로 승계. 생성 후 불변.
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  -- 식별·기본 (현행 cafes.json 필드)
  name    text not null,
  address text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  naver_place_url text,
  open_time  time,
  close_time time,   -- 자정 마감은 '00:00'
  is_24h boolean not null default false,
  iced_americano_price integer check (iced_americano_price >= 0),

  -- 작업 적합성
  outlet   outlet_level   not null,
  wifi     boolean        not null,
  noise    noise_level    not null,
  work_fit work_fit_level not null,
  tags     text[]         not null default '{}',

  -- 신뢰도 메타 (scope.md 3.5 — 부가 정보가 아니라 1급 데이터)
  last_verified date,
  verify_method verify_method,
  source_note   text,

  -- 운영: 사장 항의·정보 분쟁 시 삭제 대신 내리기 (scope.md 5-3)
  is_visible boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 24시간이 아니면 영업시간이 있어야 한다
  constraint hours_present check (is_24h or (open_time is not null and close_time is not null))
);

create index places_tags_gin on public.places using gin (tags);
create index places_lat_lng  on public.places (lat, lng);  -- 뷰포트 bbox 조회용
```

설계 메모:

- **uuid PK + slug 분리**: 내부 참조(FK)는 uuid로, URL은 slug로. slug를 PK로 쓰면 이름 정정 때 참조가 전부 흔들린다.
- `last_verified`/`verify_method`는 **nullable** — 현행 JSON에 없는 값을 이관 시점에 지어내지 않기 위함. 제보 승인·재조사가 채워나간다.
- `tags`는 `text[]` + GIN. 100곳 규모에서 태그 정규화 테이블은 과설계. 태그 통합/개명이 필요해지는 시점에 분리한다 (6장).
- 자정을 넘기는 마감(예: 투썸 02:00)은 `close_time < open_time`으로 표현된다. 표시 로직이 해석하며, DB는 형식만 보장한다.

### 2.3 `place_submissions` — 제보 인박스

```sql
create table public.place_submissions (
  id uuid primary key default gen_random_uuid(),

  type     submission_type not null,
  -- correction이면 대상 장소, new_place면 null
  place_id uuid references public.places (id) on delete set null,

  -- 제안된 필드들의 부분집합 (예: {"outlet": "some", "close_time": "21:00"}).
  -- places 컬럼을 통째로 복제하지 않는 이유: 정정 제보는 대개 한두 필드이고,
  -- 스키마가 진화해도 인박스 테이블 마이그레이션이 필요 없다.
  -- 형식 검증은 서버에서 zod로 하고 통과분만 저장한다.
  payload jsonb not null,
  note    text,            -- 제보자 자유 메모 ("입구 안내문 찍은 날짜: ...")

  -- nullable인 이유: 탈퇴(auth.users 삭제) 시 제보 이력은 남기고 작성자만 지운다.
  -- not null + on delete set null 조합은 탈퇴 시점에 제약 위반으로 터진다(v1의 오류).
  -- 실제 insert 시에는 아래 RLS가 로그인·본인 명의를 강제하므로 항상 채워진다.
  submitted_by uuid references auth.users (id) on delete set null,

  status      submission_status not null default 'pending',
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  review_note text,        -- 반려 사유 등

  created_at timestamptz not null default now(),

  constraint correction_has_target check ((type = 'correction') = (place_id is not null))
);

create index submissions_status_idx on public.place_submissions (status, created_at);
create index submissions_place_idx  on public.place_submissions (place_id) where place_id is not null;
```

승인 흐름 (서버 코드, service role):

1. 운영자가 `pending` 제보 확인 → 필요 시 현장/전화 재확인.
2. 승인: `payload`를 `places`에 반영하고 `last_verified = 오늘`, `verify_method`를 실제 확인 방법(재확인 안 했으면 `'report'`)으로 기록. `status = 'approved'`, `reviewed_*` 스탬프.
3. 반려: `status = 'rejected'` + `review_note`.

### 2.4 `profiles` — 사용자 역할

```sql
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role         text not null default 'user' check (role in ('user', 'moderator')),
  created_at   timestamptz not null default now()
);

-- role 자가 승격 차단: RLS는 컬럼 단위를 못 거르므로 컬럼 권한으로 막는다.
-- (update는 RLS 정책과 컬럼 grant를 모두 통과해야 한다)
revoke update on public.profiles from authenticated;
grant  update (display_name) on public.profiles to authenticated;

-- Supabase 관례: 가입 시 profiles 행 자동 생성
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 2.5 공통: `updated_at` 트리거

```sql
-- search_path 고정은 Supabase 보안 lint(function_search_path_mutable) 대응
create function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger places_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();
```

## 3. RLS 정책

모든 테이블 RLS 활성화. 요약: **places는 모두 읽기·아무도 못 쓰기, submissions는 본인 것만 쓰고 읽기, moderator는 전부.**

1단계 마이그레이션에는 `profiles`가 없으므로 `places_public_read`를 `using (is_visible)`로 넣었다. 제보 단계에서 아래의 `is_moderator()` 포함 버전으로 **교체**(drop 후 재생성)한다.

```sql
alter table public.places            enable row level security;
alter table public.place_submissions enable row level security;
alter table public.profiles          enable row level security;

-- 역할 판정 헬퍼. security definer라 profiles의 RLS를 우회해 판정할 수 있다.
create function public.is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'moderator'
  );
$$;

-- places: 익명 포함 모두 읽기 (내려진 항목은 moderator만). 쓰기 정책 없음 = service role만 쓴다.
create policy "places_public_read" on public.places
  for select using (is_visible or public.is_moderator());

-- submissions: 로그인 사용자가 본인 명의로만 제보
create policy "submissions_insert_own" on public.place_submissions
  for insert to authenticated
  with check (submitted_by = auth.uid() and status = 'pending');

create policy "submissions_read_own" on public.place_submissions
  for select to authenticated
  using (submitted_by = auth.uid() or public.is_moderator());

create policy "submissions_moderate" on public.place_submissions
  for update to authenticated
  using (public.is_moderator());

-- profiles: 본인 행만 읽기/수정 (role 컬럼은 2.4의 컬럼 권한으로 차단 — service role 전용)
create policy "profiles_read_own"   on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());
```

메모: `places` 반영(승인)은 반드시 서버(service role) 경유이므로 클라이언트 권한으로는 불가능하다.

## 4. `data/cafes.json` → DB 이관 매핑

`supabase/migrations/20260817093736_seed_places_from_cafes_json.sql`로 구현됨 (9곳, `on conflict (slug) do nothing`으로 재실행 안전).

| JSON 필드 | 컬럼 | 변환 |
|---|---|---|
| `id` | `slug` | 그대로 (uuid는 새로 발급) |
| `name` `address` `lat` `lng` `naver_place_url` `is_24h` | 동명 컬럼 | 그대로 |
| `open_time` / `close_time` | `open_time` / `close_time` | `"HH:MM"` → `time` |
| `iced_americano_price` | 동명 | 그대로 |
| `outlet` / `noise` / `work_fit` | 동명 (enum) | 그대로 (어휘 일치) |
| `wifi` | `wifi` | boolean 그대로 |
| `tags` | `tags` | `text[]` |
| — | `last_verified` `verify_method` `source_note` | **null** (지어내지 않는다) |

이관 후에도 zod 스키마(`lib/cafes/schema.ts`)는 앱 쪽 계약으로 유지하고, DB 응답을 같은 스키마로 파싱해 이중 검증한다.

## 5. 장기 스키마(`docs/data-schema.md`) 확장 경로

지금 넣지 않고, 현장 조사 데이터가 생길 때 컬럼 추가로 흡수한다:

- `power_note text`, `seat_types text[]`, `table_size`, `music_volume`, `seat_count_approx`, `busy_hours`, `restroom` — 전부 nullable 추가라 무중단.
- **정책 필드**는 zod `.refine()`과 같은 제약을 DB에도 건다:

  ```sql
  -- study_policy가 있으면 출처가 매장 게시물 또는 직원 확인이어야 한다 (scope.md 5-3)
  constraint policy_needs_source check (
    study_policy is null or policy_source in ('notice', 'staff')
  )
  ```

- 요일별 영업시간이 필요해지면 `open_time`/`close_time`을 유지한 채 `place_hours(place_id, day, open, close)` 테이블을 추가하고 점진 이전.
- `photos` — Supabase Storage 버킷 + `place_photos(place_id, path, taken_by, created_at)`. 본인 촬영분만 원칙은 업로드 정책으로.

## 6. 열린 질문

1. **비로그인 제보 허용 여부** — 이 초안은 제보에 로그인 필수(insert 정책이 강제. 컬럼 자체는 탈퇴 대비 nullable). 익명 제보를 받으려면 정책을 풀고 스팸 대책(rate limit, captcha)이 같이 필요하다. scope.md의 외부 폼(익명)과 어느 쪽 전환율이 나은지는 1단계 계측이 알려줄 것.
2. **PostGIS 도입 시점** — 상권 1곳·100곳 규모에선 `(lat, lng)` btree로 충분. 상권이 늘어 "내 주변" 반경 검색이 생기면 `geography(point)` + GiST로 전환.
3. **태그 정규화** — 태그 개명·통합·자동완성이 필요해지면 `tags`/`place_tags` 분리.
4. **정정 이력 보존** — `place_submissions`가 사실상 이력 역할을 하지만, 필드 단위 변경 이력이 필요하면 `place_revisions` 추가 검토.
