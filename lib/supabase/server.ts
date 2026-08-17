import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Supabase 접근의 단일 진입점 (lib/kakao/loader.ts와 같은 싱글턴 패턴).
 *
 * 서버 컴포넌트 전용이라 env에 NEXT_PUBLIC 접두사를 쓰지 않는다 — publishable
 * key는 공개돼도 안전하지만(RLS가 지킨다), 클라이언트에서 쓸 일이 생기기
 * 전까지는 번들에 실어 보내지 않는다.
 */

let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY가 설정되지 않았습니다. " +
        ".env.local.example을 참고해 .env.local을 채우고 dev 서버를 재시작하세요.",
    );
  }

  // 익명 읽기 전용이라 세션 저장·토큰 갱신이 필요 없다.
  client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
