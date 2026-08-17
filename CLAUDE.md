# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 카공맵

노트북 작업 카페 큐레이션 지도. 한 상권(송파·잠실) 수요 검증용 정적 사이트.
Next.js 16 (App Router, Turbopack) + React 19 + Tailwind 4 + zod 4.

## 명령어

- `npm run dev` — 개발 서버, 포트 **3030** (http://localhost:3030)
- `npm run build` / `npm run lint` / `npx tsc --noEmit`
  (tsc는 dev 또는 build를 한 번 돌려 `.next/types`가 생성된 뒤에 통과한다)

## 헌법: docs/scope.md

- **로그인·쓰기 API를 만들지 않는다.** 읽기 데이터는 Supabase `places` 테이블
  (2026-08 사용자 결정으로 JSON에서 전환 — scope.md "DB 없음"의 유일한 예외, 읽기 전용).
  `data/cafes.json`은 시드 마이그레이션의 원본 기록으로만 남고 앱은 읽지 않는다.
- 제보·웨이팅리스트는 외부 폼 임베드로 처리한다.
- `docs/data-schema.md`는 장기 스키마 명세로, 현재 `lib/cafes/schema.ts`와 **다르다**.
  이관은 별도 단계이며 그 전까지는 코드(`schema.ts`)가 우선한다.

## 아키텍처

데이터 흐름은 단선이다:

```
Supabase places ──lib/supabase/server.ts──▶ lib/cafes/repository.ts   zod 이중 검증 + 프로세스 캐시. 실패 시 throw
                                        │  getCafes()
                                        ▼
                                 app/page.tsx               서버 컴포넌트 (빌드 타임 조회·정적 프리렌더)
                                        │  props (직렬화 가능한 plain JSON)
                                        ▼
                                 components/map/KakaoMap.tsx   "use client" — 유일한 경계
                                        ├─ lib/kakao/loader.ts  SDK <script> 주입, Promise 싱글턴
                                        └─ CafeMarkers          마커 생성/정리 + setBounds
```

- 서버→클라이언트 경계는 `page.tsx → <KakaoMap cafes={...}>` 한 곳뿐이다. 새 기능도 이 경계를 유지할 것.
- 지도 뷰포트는 `CafeMarkers`의 `setBounds`가 데이터 기준으로 결정한다. `KakaoMap`의 `DEFAULT_CENTER`는 마커 마운트 전 폴백일 뿐이다.
- `CafeMarkers`는 `onSelect`를 ref로 감싼다 — 의존성에 넣으면 선택 변경마다 마커가 재생성되고 지도가 튄다. 이 패턴을 깨지 말 것.
- 상태 관리 라이브러리 없음. `KakaoMap`의 로컬 useState가 전부.

### git 히스토리의 재사용 재료

커밋 `e2733d2`에 다음 단계용 검증된 코드가 있다 (`git show e2733d2:<path>`로 열람):
`components/map/CafeDetailPanel.tsx`(상세 패널 — ESC 닫기, 모바일 하단 시트, 요일 병합 formatHours),
`lib/cafes/freshness.ts`(90일 "정보 오래됨" 배지 — `last_verified` 도입 시),
`lib/cafes/schema.ts`(장기 스키마의 zod 버전 — 정책 필드 출처 강제 refine 포함).

## 아키텍처 규칙

- 카페 데이터 접근은 반드시 `lib/cafes/repository.ts` 경유 (컴포넌트에서 Supabase 직접 호출 금지).
  Supabase 클라이언트는 `lib/supabase/server.ts` 단일 진입점(서버 전용, env에 NEXT_PUBLIC 없음).
  스키마 마이그레이션 후에는 `lib/supabase/database.types.ts`를 재생성해 통째로 덮어쓴다.
- 카카오 SDK 로드는 `lib/kakao/loader.ts` 단일 진입점. 타입은 `lib/kakao/kakao.d.ts`에만
  추가하고, 없는 멤버를 any로 우회하지 않는다.
- enum → 한글 라벨은 `lib/cafes/labels.ts`의 `Record<Enum, string>` 패턴
  (스키마에 값이 추가되면 컴파일 에러로 라벨 누락을 강제 검출).
- 주석은 "무엇"이 아니라 "왜"를 적는다.

## 데이터 편집

- 데이터 편집은 Supabase `places`에서 한다 (클라이언트 쓰기 정책이 없으므로 대시보드 SQL 등
  service role 경유). `data/cafes.json`을 고쳐도 앱에는 반영되지 않는다.
- 새 카페의 `slug`는 ascii kebab-case로 부여하고 이후 바꾸지 않는다 (URL 공유용 안정 식별자.
  앱 코드에서는 `Cafe.id`로 노출된다).
- 스키마 위반·slug 중복은 DB 제약과 렌더 시 zod 이중 검증이 즉시 잡는다 (조용히 넘어가지 않는다).
- 데이터 변경을 화면에 반영하려면: dev는 서버 재시작(프로세스당 1회 조회), 프로덕션은 재빌드
  (빌드 타임 프리렌더).

## 환경 변수

- `NEXT_PUBLIC_KAKAO_MAP_KEY` — `.env.local` (예시: `.env.local.example`).
  값 변경 후 dev 서버 재시작 필요 (빌드 타임 인라인).
- `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` — 서버 전용(NEXT_PUBLIC 아님),
  `lib/supabase/server.ts`만 읽는다. 빌드 타임 조회에 쓰이므로 배포/CI 환경에도 설정할 것.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
