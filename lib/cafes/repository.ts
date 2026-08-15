import cafesFile from "@/data/cafes.json";
import { cafesFileSchema, type Cafe } from "./schema";

/**
 * 카페 데이터 접근의 단일 경계.
 *
 * 컴포넌트는 `data/cafes.json`을 직접 import하지 않고 반드시 이 모듈을 통한다.
 * 나중에 로그인·제보가 붙어 데이터 소스가 JSON → DB로 바뀔 때, 이 파일만
 * 갈아끼우면 호출부는 그대로 둘 수 있다. 그래서 지금은 동기 함수로 충분한데도
 * 전부 async로 선언해둔다 — 시그니처가 바뀌지 않도록.
 *
 * 쓰기(제보 등록/수정)도 나중에 여기에 추가한다.
 */

let cache: Cafe[] | null = null;

function loadAll(): Cafe[] {
  if (cache) return cache;

  const parsed = cafesFileSchema.safeParse(cafesFile);

  if (!parsed.success) {
    // 손으로 채우는 데이터라 오타·누락이 실제로 발생한다. 조용히 넘기면
    // 지도에 잘못된 정보가 그대로 뜨므로 여기서 즉시 실패시킨다.
    throw new Error(
      `data/cafes.json 검증 실패:\n${JSON.stringify(parsed.error.issues, null, 2)}`,
    );
  }

  cache = parsed.data.cafes;
  return cache;
}

export async function getCafes(): Promise<Cafe[]> {
  return loadAll();
}

export async function getCafeById(id: string): Promise<Cafe | null> {
  return loadAll().find((cafe) => cafe.id === id) ?? null;
}
