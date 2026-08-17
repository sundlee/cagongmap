/**
 * Supabase CLI/MCP `generate typescript types` 산출물 — 손으로 편집하지 않는다.
 * 스키마 마이그레이션 후 재생성해서 통째로 덮어쓴다.
 * (enum 어휘가 lib/cafes/schema.ts의 zod enum과 어긋나면 repository.ts가 컴파일에서 잡힌다)
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      places: {
        Row: {
          address: string
          close_time: string | null
          created_at: string
          iced_americano_price: number | null
          id: string
          is_24h: boolean
          is_visible: boolean
          last_verified: string | null
          lat: number
          lng: number
          name: string
          naver_place_url: string | null
          noise: Database["public"]["Enums"]["noise_level"]
          open_time: string | null
          outlet: Database["public"]["Enums"]["outlet_level"]
          slug: string
          source_note: string | null
          tags: string[]
          updated_at: string
          verify_method: Database["public"]["Enums"]["verify_method"] | null
          wifi: boolean
          work_fit: Database["public"]["Enums"]["work_fit_level"]
        }
        Insert: {
          address: string
          close_time?: string | null
          created_at?: string
          iced_americano_price?: number | null
          id?: string
          is_24h?: boolean
          is_visible?: boolean
          last_verified?: string | null
          lat: number
          lng: number
          name: string
          naver_place_url?: string | null
          noise: Database["public"]["Enums"]["noise_level"]
          open_time?: string | null
          outlet: Database["public"]["Enums"]["outlet_level"]
          slug: string
          source_note?: string | null
          tags?: string[]
          updated_at?: string
          verify_method?: Database["public"]["Enums"]["verify_method"] | null
          wifi: boolean
          work_fit: Database["public"]["Enums"]["work_fit_level"]
        }
        Update: {
          address?: string
          close_time?: string | null
          created_at?: string
          iced_americano_price?: number | null
          id?: string
          is_24h?: boolean
          is_visible?: boolean
          last_verified?: string | null
          lat?: number
          lng?: number
          name?: string
          naver_place_url?: string | null
          noise?: Database["public"]["Enums"]["noise_level"]
          open_time?: string | null
          outlet?: Database["public"]["Enums"]["outlet_level"]
          slug?: string
          source_note?: string | null
          tags?: string[]
          updated_at?: string
          verify_method?: Database["public"]["Enums"]["verify_method"] | null
          wifi?: boolean
          work_fit?: Database["public"]["Enums"]["work_fit_level"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      noise_level: "quiet" | "normal" | "loud"
      outlet_level: "many" | "some" | "few"
      verify_method: "visited" | "called" | "review_crosscheck" | "report"
      work_fit_level: "good" | "ok" | "bad"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      noise_level: ["quiet", "normal", "loud"],
      outlet_level: ["many", "some", "few"],
      verify_method: ["visited", "called", "review_crosscheck", "report"],
      work_fit_level: ["good", "ok", "bad"],
    },
  },
} as const
