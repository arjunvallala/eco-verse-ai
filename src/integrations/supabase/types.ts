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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      challenges: {
        Row: {
          category: string
          co2_savings_kg: number
          created_at: string
          description: string
          difficulty: string
          id: string
          slug: string
          title: string
          xp_reward: number
        }
        Insert: {
          category: string
          co2_savings_kg?: number
          created_at?: string
          description: string
          difficulty?: string
          id?: string
          slug: string
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string
          co2_savings_kg?: number
          created_at?: string
          description?: string
          difficulty?: string
          id?: string
          slug?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      emission_logs: {
        Row: {
          activity: string
          category: string
          co2_kg: number
          created_at: string
          id: string
          notes: string | null
          occurred_at: string
          user_id: string
        }
        Insert: {
          activity: string
          category: string
          co2_kg: number
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          user_id: string
        }
        Update: {
          activity?: string
          category?: string
          co2_kg?: number
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          baseline_co2_kg: number | null
          commute_mode: string | null
          country: string | null
          created_at: string
          diet_type: string | null
          display_name: string | null
          electronics_upgrade_years: number | null
          fast_fashion_freq: string | null
          flights_per_year: number | null
          heating_type: string | null
          household_size: number | null
          id: string
          island_stage: number
          last_log_date: string | null
          level: number
          meals_out_per_week: number | null
          onboarding_complete: boolean
          renewable_pct: number | null
          streak_days: number
          streaming_hours_per_week: number | null
          total_co2_saved_kg: number
          updated_at: string
          weekly_km: number | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          baseline_co2_kg?: number | null
          commute_mode?: string | null
          country?: string | null
          created_at?: string
          diet_type?: string | null
          display_name?: string | null
          electronics_upgrade_years?: number | null
          fast_fashion_freq?: string | null
          flights_per_year?: number | null
          heating_type?: string | null
          household_size?: number | null
          id: string
          island_stage?: number
          last_log_date?: string | null
          level?: number
          meals_out_per_week?: number | null
          onboarding_complete?: boolean
          renewable_pct?: number | null
          streak_days?: number
          streaming_hours_per_week?: number | null
          total_co2_saved_kg?: number
          updated_at?: string
          weekly_km?: number | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          baseline_co2_kg?: number | null
          commute_mode?: string | null
          country?: string | null
          created_at?: string
          diet_type?: string | null
          display_name?: string | null
          electronics_upgrade_years?: number | null
          fast_fashion_freq?: string | null
          flights_per_year?: number | null
          heating_type?: string | null
          household_size?: number | null
          id?: string
          island_stage?: number
          last_log_date?: string | null
          level?: number
          meals_out_per_week?: number | null
          onboarding_complete?: boolean
          renewable_pct?: number | null
          streak_days?: number
          streaming_hours_per_week?: number | null
          total_co2_saved_kg?: number
          updated_at?: string
          weekly_km?: number | null
          xp?: number
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          accepted_at: string
          challenge_id: string
          completed_at: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          challenge_id: string
          completed_at?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          challenge_id?: string
          completed_at?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
