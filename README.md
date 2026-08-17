# 카공맵

노트북 작업하기 좋은 카페를 지도에서 찾는 서비스. 지금은 한 상권(송파·잠실)을
수동 큐레이션한 정적 사이트로 수요를 검증하는 단계다. 배경과 범위는
[`docs/scope.md`](docs/scope.md) 참고.

## 실행

```
npm ci
```

1. `.env.local.example`을 `.env.local`로 복사하고 카카오 **JavaScript 키**를 넣는다.
2. [카카오 개발자 콘솔](https://developers.kakao.com)의 앱 설정 → 플랫폼 → Web에
   `http://localhost:3030` 을 등록한다.
3. `npm run dev` → http://localhost:3030

키가 없으면 지도 대신 설정 안내 화면이 뜬다.

## 구조

| 경로 | 역할 |
|---|---|
| `data/cafes.json` | 카페 데이터 단일 파일 (백엔드 없음) |
| `lib/cafes/` | zod 스키마 + 데이터 접근 계층. 컴포넌트는 JSON을 직접 import하지 않는다 |
| `lib/kakao/` | 카카오맵 SDK 로더와 타입 선언 |
| `components/map/` | 지도·마커 클라이언트 컴포넌트 |
| `docs/` | 범위 결정서(`scope.md`), 장기 데이터 스키마(`data-schema.md`), 시장 조사 |

## 명령어

- `npm run dev` — 개발 서버 (포트 3030)
- `npm run build` / `npm run start` — 프로덕션 빌드·실행 (포트 3030)
- `npm run lint` / `npx tsc --noEmit` — 정적 검사
