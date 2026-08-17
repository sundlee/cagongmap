-- 카공맵 places 테이블 (docs/db-schema.md 2장 DDL 승계, 테이블명만 places)
-- 1단계 범위: 공개 읽기 전용 데이터 테이블 하나.
-- 제보 단계 테이블(cafe_submissions, profiles)과 is_moderator() 기반 정책은 그 단계에서 추가한다.

-- lib/cafes/schema.ts의 zod enum과 1:1 유지 (supabase gen types가 TS 유니언으로 뽑아준다)
create type outlet_level   as enum ('many', 'some', 'few');
create type noise_level    as enum ('quiet', 'normal', 'loud');
create type work_fit_level as enum ('good', 'ok', 'bad');

-- 'report' = 제보로 갱신됐고 운영자가 독립 재확인은 안 한 상태
create type verify_method as enum ('visited', 'called', 'review_crosscheck', 'report');

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

create function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger places_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

-- RLS: 모두 읽기(내려진 항목 제외), 쓰기 정책 없음 = service role만 쓴다
alter table public.places enable row level security;

create policy "places_public_read" on public.places
  for select using (is_visible);
