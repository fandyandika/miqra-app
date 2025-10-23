export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      checkins: {
        Row: {
          ayat_count: number;
          created_at: string | null;
          date: string;
          id: string;
          user_id: string | null;
        };
        Insert: {
          ayat_count: number;
          created_at?: string | null;
          date: string;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          ayat_count?: number;
          created_at?: string | null;
          date?: string;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      device_tokens: {
        Row: {
          created_at: string | null;
          id: string;
          platform: string;
          token: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          platform: string;
          token: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          platform?: string;
          token?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      families: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          created_at: string | null;
          family_id: string | null;
          id: string;
          role: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          family_id?: string | null;
          id?: string;
          role?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          family_id?: string | null;
          id?: string;
          role?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'family_members_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
        ];
      };
      invite_codes: {
        Row: {
          code: string;
          family_id: string | null;
          ttl: string;
          used: boolean | null;
        };
        Insert: {
          code: string;
          family_id?: string | null;
          ttl: string;
          used?: boolean | null;
        };
        Update: {
          code?: string;
          family_id?: string | null;
          ttl?: string;
          used?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invite_codes_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          display_name: string | null;
          lat: number | null;
          lng: number | null;
          timezone: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          display_name?: string | null;
          lat?: number | null;
          lng?: number | null;
          timezone?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          display_name?: string | null;
          lat?: number | null;
          lng?: number | null;
          timezone?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      reading_progress: {
        Row: {
          current_ayat: number;
          current_surah: number;
          khatam_count: number;
          last_read_at: string | null;
          total_ayat_read: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          current_ayat?: number;
          current_surah?: number;
          khatam_count?: number;
          last_read_at?: string | null;
          total_ayat_read?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          current_ayat?: number;
          current_surah?: number;
          khatam_count?: number;
          last_read_at?: string | null;
          total_ayat_read?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      reading_sessions: {
        Row: {
          ayat_count: number | null;
          ayat_end: number;
          ayat_start: number;
          created_at: string;
          date: string;
          id: string;
          notes: string | null;
          session_time: string;
          surah_number: number;
          user_id: string;
        };
        Insert: {
          ayat_count?: number | null;
          ayat_end: number;
          ayat_start: number;
          created_at?: string;
          date?: string;
          id?: string;
          notes?: string | null;
          session_time?: string;
          surah_number: number;
          user_id: string;
        };
        Update: {
          ayat_count?: number | null;
          ayat_end?: number;
          ayat_start?: number;
          created_at?: string;
          date?: string;
          id?: string;
          notes?: string | null;
          session_time?: string;
          surah_number?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      streaks: {
        Row: {
          current: number | null;
          last_date: string | null;
          longest: number | null;
          user_id: string;
        };
        Insert: {
          current?: number | null;
          last_date?: string | null;
          longest?: number | null;
          user_id: string;
        };
        Update: {
          current?: number | null;
          last_date?: string | null;
          longest?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          created_at: string | null;
          daily_goal_ayat: number | null;
          daily_reminder_enabled: boolean | null;
          family_nudge_enabled: boolean | null;
          hasanat_visible: boolean | null;
          join_leaderboard: boolean | null;
          milestone_celebration_enabled: boolean | null;
          reminder_time: string | null;
          share_with_family: boolean | null;
          streak_warning_enabled: boolean | null;
          theme: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          daily_goal_ayat?: number | null;
          daily_reminder_enabled?: boolean | null;
          family_nudge_enabled?: boolean | null;
          hasanat_visible?: boolean | null;
          join_leaderboard?: boolean | null;
          milestone_celebration_enabled?: boolean | null;
          reminder_time?: string | null;
          share_with_family?: boolean | null;
          streak_warning_enabled?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          daily_goal_ayat?: number | null;
          daily_reminder_enabled?: boolean | null;
          family_nudge_enabled?: boolean | null;
          hasanat_visible?: boolean | null;
          join_leaderboard?: boolean | null;
          milestone_celebration_enabled?: boolean | null;
          reminder_time?: string | null;
          share_with_family?: boolean | null;
          streak_warning_enabled?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      _rs_date: {
        Args: { created_at: string; session_time: string };
        Returns: string;
      };
      _rs_day: { Args: { ts: string }; Returns: string };
      create_invite:
        | {
            Args: { fid: string; ttl_minutes?: number };
            Returns: {
              code: string;
              expires_at: string;
            }[];
          }
        | {
            Args: { fid: string; ttl_minutes?: number };
            Returns: {
              code: string;
              expires_at: string;
            }[];
          };
      get_daily_stats: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string };
        Returns: {
          ayat_count: number;
          date: string;
          session_count: number;
        }[];
      };
      get_family_stats:
        | {
            Args: { p_family_id: string };
            Returns: {
              error: true;
            } & 'Could not choose the best candidate function between: public.get_family_stats(p_family_id => text), public.get_family_stats(p_family_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved'[];
          }
        | {
            Args: { p_family_id: string };
            Returns: {
              error: true;
            } & 'Could not choose the best candidate function between: public.get_family_stats(p_family_id => text), public.get_family_stats(p_family_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved'[];
          };
      get_monthly_stats: {
        Args: { p_months: number; p_user_id: string };
        Returns: {
          avg_ayat_per_day: number;
          days_active: number;
          month: string;
          total_ayat: number;
          total_days: number;
        }[];
      };
      get_user_total_stats: {
        Args: { p_user_id: string };
        Returns: {
          current_streak: number;
          longest_streak: number;
          total_ayat: number;
          total_sessions: number;
        }[];
      };
      get_weekly_stats: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string };
        Returns: {
          avg_ayat_per_day: number;
          days_active: number;
          total_ayat: number;
          week_start: string;
        }[];
      };
      is_family_owner:
        | { Args: { p_user_id: string }; Returns: boolean }
        | { Args: { family_id: string }; Returns: boolean };
      is_member_of_family: { Args: { fam_id: string }; Returns: boolean };
      is_owner_of_family: { Args: { fam_id: string }; Returns: boolean };
      redeem_invite: { Args: { p_code: string }; Returns: string };
      update_streak_after_checkin:
        | { Args: { checkin_date: string }; Returns: undefined }
        | {
            Args: { checkin_date: string; checkin_user_id: string };
            Returns: undefined;
          };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
