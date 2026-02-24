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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_journey: {
        Row: {
          ap_exams: Json | null
          class_rank: string | null
          class_size: number | null
          college_courses: Json | null
          course_history: Json | null
          created_at: string
          current_grade: string | null
          current_school: Json | null
          english_proficiency: Json | null
          expected_grad_date: string | null
          gpa: number | null
          gpa_scale: string | null
          gpa_type: string | null
          homeschooled: boolean | null
          ib_exams: Json | null
          id: string
          in_ib_programme: boolean | null
          is_boarding_school: boolean | null
          need_english_proficiency: boolean | null
          other_schools: Json | null
          profile_id: string
          rank_reporting_method: string | null
          report_test_scores: boolean | null
          standardized_tests: Json | null
          studied_abroad: boolean | null
          taking_ap_exams: boolean | null
          took_language_early: boolean | null
          took_math_early: boolean | null
          updated_at: string
          will_graduate_from_school: boolean | null
        }
        Insert: {
          ap_exams?: Json | null
          class_rank?: string | null
          class_size?: number | null
          college_courses?: Json | null
          course_history?: Json | null
          created_at?: string
          current_grade?: string | null
          current_school?: Json | null
          english_proficiency?: Json | null
          expected_grad_date?: string | null
          gpa?: number | null
          gpa_scale?: string | null
          gpa_type?: string | null
          homeschooled?: boolean | null
          ib_exams?: Json | null
          id?: string
          in_ib_programme?: boolean | null
          is_boarding_school?: boolean | null
          need_english_proficiency?: boolean | null
          other_schools?: Json | null
          profile_id: string
          rank_reporting_method?: string | null
          report_test_scores?: boolean | null
          standardized_tests?: Json | null
          studied_abroad?: boolean | null
          taking_ap_exams?: boolean | null
          took_language_early?: boolean | null
          took_math_early?: boolean | null
          updated_at?: string
          will_graduate_from_school?: boolean | null
        }
        Update: {
          ap_exams?: Json | null
          class_rank?: string | null
          class_size?: number | null
          college_courses?: Json | null
          course_history?: Json | null
          created_at?: string
          current_grade?: string | null
          current_school?: Json | null
          english_proficiency?: Json | null
          expected_grad_date?: string | null
          gpa?: number | null
          gpa_scale?: string | null
          gpa_type?: string | null
          homeschooled?: boolean | null
          ib_exams?: Json | null
          id?: string
          in_ib_programme?: boolean | null
          is_boarding_school?: boolean | null
          need_english_proficiency?: boolean | null
          other_schools?: Json | null
          profile_id?: string
          rank_reporting_method?: string | null
          report_test_scores?: boolean | null
          standardized_tests?: Json | null
          studied_abroad?: boolean | null
          taking_ap_exams?: boolean | null
          took_language_early?: boolean | null
          took_math_early?: boolean | null
          updated_at?: string
          will_graduate_from_school?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_journey_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      essay_analysis_reports: {
        Row: {
          created_at: string
          dimension_scores: Json | null
          essay_id: string
          id: string
          improvements: Json | null
          overall_score: number | null
          raw_result: Json | null
          strengths: Json | null
          summary: string | null
          teaching_feedback: Json | null
        }
        Insert: {
          created_at?: string
          dimension_scores?: Json | null
          essay_id: string
          id?: string
          improvements?: Json | null
          overall_score?: number | null
          raw_result?: Json | null
          strengths?: Json | null
          summary?: string | null
          teaching_feedback?: Json | null
        }
        Update: {
          created_at?: string
          dimension_scores?: Json | null
          essay_id?: string
          id?: string
          improvements?: Json | null
          overall_score?: number | null
          raw_result?: Json | null
          strengths?: Json | null
          summary?: string | null
          teaching_feedback?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "essay_analysis_reports_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "essays"
            referencedColumns: ["id"]
          },
        ]
      }
      essay_revision_history: {
        Row: {
          analysis_report_id: string | null
          change_summary: string | null
          created_at: string
          created_by: string | null
          dimension_scores: Json | null
          draft_content: string | null
          essay_id: string
          id: string
          is_deleted: boolean
          label: string | null
          parent_version_id: string | null
          score: number | null
          version: number
          word_count: number | null
        }
        Insert: {
          analysis_report_id?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          dimension_scores?: Json | null
          draft_content?: string | null
          essay_id: string
          id?: string
          is_deleted?: boolean
          label?: string | null
          parent_version_id?: string | null
          score?: number | null
          version: number
          word_count?: number | null
        }
        Update: {
          analysis_report_id?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          dimension_scores?: Json | null
          draft_content?: string | null
          essay_id?: string
          id?: string
          is_deleted?: boolean
          label?: string | null
          parent_version_id?: string | null
          score?: number | null
          version?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "essay_revision_history_analysis_report_id_fkey"
            columns: ["analysis_report_id"]
            isOneToOne: false
            referencedRelation: "essay_analysis_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essay_revision_history_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "essays"
            referencedColumns: ["id"]
          },
        ]
      }
      essays: {
        Row: {
          created_at: string
          draft_current: string | null
          draft_original: string | null
          essay_type: string
          id: string
          locked: boolean
          max_words: number | null
          prompt_text: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          draft_current?: string | null
          draft_original?: string | null
          essay_type: string
          id?: string
          locked?: boolean
          max_words?: number | null
          prompt_text?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          draft_current?: string | null
          draft_original?: string | null
          essay_type?: string
          id?: string
          locked?: boolean
          max_words?: number | null
          prompt_text?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      experiences_activities: {
        Row: {
          created_at: string
          extracurriculars: Json | null
          id: string
          personal_projects: Json | null
          profile_id: string
          updated_at: string
          volunteer_service: Json | null
          work_experiences: Json | null
        }
        Insert: {
          created_at?: string
          extracurriculars?: Json | null
          id?: string
          personal_projects?: Json | null
          profile_id: string
          updated_at?: string
          volunteer_service?: Json | null
          work_experiences?: Json | null
        }
        Update: {
          created_at?: string
          extracurriculars?: Json | null
          id?: string
          personal_projects?: Json | null
          profile_id?: string
          updated_at?: string
          volunteer_service?: Json | null
          work_experiences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_activities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_responsibilities: {
        Row: {
          created_at: string
          id: string
          life_circumstances: Json | null
          profile_id: string
          responsibilities: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          life_circumstances?: Json | null
          profile_id: string
          responsibilities?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          life_circumstances?: Json | null
          profile_id?: string
          responsibilities?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_responsibilities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals_aspirations: {
        Row: {
          career_interests: Json | null
          college_plans: Json | null
          created_at: string
          highest_degree: string | null
          id: string
          intended_major: string | null
          preferred_environment: Json | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          career_interests?: Json | null
          college_plans?: Json | null
          created_at?: string
          highest_degree?: string | null
          id?: string
          intended_major?: string | null
          preferred_environment?: Json | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          career_interests?: Json | null
          college_plans?: Json | null
          created_at?: string
          highest_degree?: string | null
          id?: string
          intended_major?: string | null
          preferred_environment?: Json | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_aspirations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_growth: {
        Row: {
          additional_context: Json | null
          created_at: string
          id: string
          meaningful_experiences: Json | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          additional_context?: Json | null
          created_at?: string
          id?: string
          meaningful_experiences?: Json | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          additional_context?: Json | null
          created_at?: string
          id?: string
          meaningful_experiences?: Json | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_growth_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_information: {
        Row: {
          alternate_address: Json | null
          citizenship_status: string | null
          created_at: string
          date_of_birth: string | null
          first_gen: boolean | null
          first_name: string | null
          former_names: Json | null
          gender_identity: string | null
          hispanic_background: string | null
          hispanic_latino: string | null
          household_income: string | null
          household_size: string | null
          id: string
          last_name: string | null
          living_situation: string | null
          other_languages: Json | null
          parent_guardians: Json | null
          permanent_address: Json | null
          place_of_birth: Json | null
          preferred_name: string | null
          primary_email: string | null
          primary_language: string | null
          primary_phone: string | null
          profile_id: string
          pronouns: string | null
          race_ethnicity: Json | null
          secondary_phone: string | null
          siblings: Json | null
          updated_at: string
          years_in_us: number | null
        }
        Insert: {
          alternate_address?: Json | null
          citizenship_status?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_gen?: boolean | null
          first_name?: string | null
          former_names?: Json | null
          gender_identity?: string | null
          hispanic_background?: string | null
          hispanic_latino?: string | null
          household_income?: string | null
          household_size?: string | null
          id?: string
          last_name?: string | null
          living_situation?: string | null
          other_languages?: Json | null
          parent_guardians?: Json | null
          permanent_address?: Json | null
          place_of_birth?: Json | null
          preferred_name?: string | null
          primary_email?: string | null
          primary_language?: string | null
          primary_phone?: string | null
          profile_id: string
          pronouns?: string | null
          race_ethnicity?: Json | null
          secondary_phone?: string | null
          siblings?: Json | null
          updated_at?: string
          years_in_us?: number | null
        }
        Update: {
          alternate_address?: Json | null
          citizenship_status?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_gen?: boolean | null
          first_name?: string | null
          former_names?: Json | null
          gender_identity?: string | null
          hispanic_background?: string | null
          hispanic_latino?: string | null
          household_income?: string | null
          household_size?: string | null
          id?: string
          last_name?: string | null
          living_situation?: string | null
          other_languages?: Json | null
          parent_guardians?: Json | null
          permanent_address?: Json | null
          place_of_birth?: Json | null
          preferred_name?: string | null
          primary_email?: string | null
          primary_language?: string | null
          primary_phone?: string | null
          profile_id?: string
          pronouns?: string | null
          race_ethnicity?: Json | null
          secondary_phone?: string | null
          siblings?: Json | null
          updated_at?: string
          years_in_us?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_information_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          completion_details: Json | null
          completion_score: number | null
          created_at: string
          credits: number
          deleted_at: string | null
          demographics: Json | null
          has_completed_assessment: boolean
          id: string
          referral_discount_active: boolean
          terms_accepted_at: string | null
          updated_at: string
          user_context: string | null
          user_id: string
        }
        Insert: {
          completion_details?: Json | null
          completion_score?: number | null
          created_at?: string
          credits?: number
          deleted_at?: string | null
          demographics?: Json | null
          has_completed_assessment?: boolean
          id?: string
          referral_discount_active?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_context?: string | null
          user_id: string
        }
        Update: {
          completion_details?: Json | null
          completion_score?: number | null
          created_at?: string
          credits?: number
          deleted_at?: string | null
          demographics?: Json | null
          has_completed_assessment?: boolean
          id?: string
          referral_discount_active?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_context?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_network: {
        Row: {
          community_support: Json | null
          counselor: Json | null
          created_at: string
          id: string
          portfolio_items: Json | null
          profile_id: string
          teachers: Json | null
          updated_at: string
        }
        Insert: {
          community_support?: Json | null
          counselor?: Json | null
          created_at?: string
          id?: string
          portfolio_items?: Json | null
          profile_id: string
          teachers?: Json | null
          updated_at?: string
        }
        Update: {
          community_support?: Json | null
          counselor?: Json | null
          created_at?: string
          id?: string
          portfolio_items?: Json | null
          profile_id?: string
          teachers?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_network_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
