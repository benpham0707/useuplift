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
    PostgrestVersion: "13.0.4"
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
          current_grade: string | null
          current_school: Json | null
          english_proficiency: Json | null
          expected_grad_date: string | null
          gpa: number | null
          gpa_scale: string | null
          gpa_type: string | null
          ib_exams: Json | null
          id: string
          other_schools: Json | null
          profile_id: string
          standardized_tests: Json | null
        }
        Insert: {
          ap_exams?: Json | null
          class_rank?: string | null
          class_size?: number | null
          college_courses?: Json | null
          course_history?: Json | null
          current_grade?: string | null
          current_school?: Json | null
          english_proficiency?: Json | null
          expected_grad_date?: string | null
          gpa?: number | null
          gpa_scale?: string | null
          gpa_type?: string | null
          ib_exams?: Json | null
          id?: string
          other_schools?: Json | null
          profile_id: string
          standardized_tests?: Json | null
        }
        Update: {
          ap_exams?: Json | null
          class_rank?: string | null
          class_size?: number | null
          college_courses?: Json | null
          course_history?: Json | null
          current_grade?: string | null
          current_school?: Json | null
          english_proficiency?: Json | null
          expected_grad_date?: string | null
          gpa?: number | null
          gpa_scale?: string | null
          gpa_type?: string | null
          ib_exams?: Json | null
          id?: string
          other_schools?: Json | null
          profile_id?: string
          standardized_tests?: Json | null
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
      experiences_activities: {
        Row: {
          academic_honors: Json | null
          extracurriculars: Json | null
          formal_recognition: Json | null
          id: string
          personal_projects: Json | null
          profile_id: string
          volunteer_service: Json | null
          work_experiences: Json | null
        }
        Insert: {
          academic_honors?: Json | null
          extracurriculars?: Json | null
          formal_recognition?: Json | null
          id?: string
          personal_projects?: Json | null
          profile_id: string
          volunteer_service?: Json | null
          work_experiences?: Json | null
        }
        Update: {
          academic_honors?: Json | null
          extracurriculars?: Json | null
          formal_recognition?: Json | null
          id?: string
          personal_projects?: Json | null
          profile_id?: string
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
          id: string
          life_circumstances: Json | null
          profile_id: string
          responsibilities: Json | null
        }
        Insert: {
          id?: string
          life_circumstances?: Json | null
          profile_id: string
          responsibilities?: Json | null
        }
        Update: {
          id?: string
          life_circumstances?: Json | null
          profile_id?: string
          responsibilities?: Json | null
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
          career_interests: string[] | null
          college_plans: Json | null
          highest_degree: string | null
          id: string
          intended_major: string | null
          preferred_environment: string[] | null
          profile_id: string
        }
        Insert: {
          career_interests?: string[] | null
          college_plans?: Json | null
          highest_degree?: string | null
          id?: string
          intended_major?: string | null
          preferred_environment?: string[] | null
          profile_id: string
        }
        Update: {
          career_interests?: string[] | null
          college_plans?: Json | null
          highest_degree?: string | null
          id?: string
          intended_major?: string | null
          preferred_environment?: string[] | null
          profile_id?: string
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
          id: string
          meaningful_experiences: Json | null
          profile_id: string
        }
        Insert: {
          additional_context?: Json | null
          id?: string
          meaningful_experiences?: Json | null
          profile_id: string
        }
        Update: {
          additional_context?: Json | null
          id?: string
          meaningful_experiences?: Json | null
          profile_id?: string
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
          date_of_birth: string | null
          first_gen: boolean | null
          first_name: string | null
          former_names: string[] | null
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
          race_ethnicity: string[] | null
          secondary_phone: string | null
          siblings: Json | null
          years_in_us: number | null
        }
        Insert: {
          alternate_address?: Json | null
          citizenship_status?: string | null
          date_of_birth?: string | null
          first_gen?: boolean | null
          first_name?: string | null
          former_names?: string[] | null
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
          race_ethnicity?: string[] | null
          secondary_phone?: string | null
          siblings?: Json | null
          years_in_us?: number | null
        }
        Update: {
          alternate_address?: Json | null
          citizenship_status?: string | null
          date_of_birth?: string | null
          first_gen?: boolean | null
          first_name?: string | null
          former_names?: string[] | null
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
          race_ethnicity?: string[] | null
          secondary_phone?: string | null
          siblings?: Json | null
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
          archived_at: string | null
          completion_details: Json
          completion_score: number
          constraints: Json
          created_at: string
          deleted_at: string | null
          demographics: Json
          enrichment_priorities: Json
          extracted_skills: Json
          goals: Json
          has_completed_assessment: boolean
          hidden_strengths: string[]
          id: string
          last_enrichment_date: string | null
          narrative_summary: string | null
          search_vector: unknown | null
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
          user_context: Database["public"]["Enums"]["user_context"]
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          completion_details?: Json
          completion_score?: number
          constraints?: Json
          created_at?: string
          deleted_at?: string | null
          demographics?: Json
          enrichment_priorities?: Json
          extracted_skills?: Json
          goals?: Json
          has_completed_assessment?: boolean
          hidden_strengths?: string[]
          id?: string
          last_enrichment_date?: string | null
          narrative_summary?: string | null
          search_vector?: unknown | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          user_context: Database["public"]["Enums"]["user_context"]
          user_id: string
        }
        Update: {
          archived_at?: string | null
          completion_details?: Json
          completion_score?: number
          constraints?: Json
          created_at?: string
          deleted_at?: string | null
          demographics?: Json
          enrichment_priorities?: Json
          extracted_skills?: Json
          goals?: Json
          has_completed_assessment?: boolean
          hidden_strengths?: string[]
          id?: string
          last_enrichment_date?: string | null
          narrative_summary?: string | null
          search_vector?: unknown | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          user_context?: Database["public"]["Enums"]["user_context"]
          user_id?: string
        }
        Relationships: []
      }
      support_network: {
        Row: {
          community_support: Json | null
          counselor: Json | null
          documents: Json | null
          id: string
          portfolio_items: Json | null
          profile_id: string
          teachers: string[] | null
        }
        Insert: {
          community_support?: Json | null
          counselor?: Json | null
          documents?: Json | null
          id?: string
          portfolio_items?: Json | null
          profile_id: string
          teachers?: string[] | null
        }
        Update: {
          community_support?: Json | null
          counselor?: Json | null
          documents?: Json | null
          id?: string
          portfolio_items?: Json | null
          profile_id?: string
          teachers?: string[] | null
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
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      achievement_impact: "low" | "medium" | "high" | "exceptional"
      achievement_scope:
        | "school"
        | "local"
        | "regional"
        | "state"
        | "national"
        | "international"
      achievement_type:
        | "academic"
        | "athletic"
        | "artistic"
        | "leadership"
        | "service"
        | "technical"
        | "entrepreneurial"
        | "competition"
        | "certification"
        | "publication"
        | "personal"
      course_level:
        | "regular"
        | "honors"
        | "ap"
        | "ib"
        | "dual_enrollment"
        | "college"
      experience_type:
        | "work"
        | "internship"
        | "volunteer"
        | "leadership"
        | "project"
        | "research"
        | "creative"
        | "athletic"
        | "entrepreneurial"
        | "caregiving"
        | "self_directed"
      gpa_scale: "4.0" | "5.0" | "100" | "international"
      profile_status:
        | "initial"
        | "basic_complete"
        | "enriched"
        | "verified"
        | "archived"
      time_commitment: "minimal" | "part_time" | "significant" | "full_time"
      user_context:
        | "high_school_9th"
        | "high_school_10th"
        | "high_school_11th"
        | "high_school_12th"
        | "gap_year"
        | "college_freshman"
        | "college_sophomore"
        | "college_junior"
        | "college_senior"
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
      achievement_impact: ["low", "medium", "high", "exceptional"],
      achievement_scope: [
        "school",
        "local",
        "regional",
        "state",
        "national",
        "international",
      ],
      achievement_type: [
        "academic",
        "athletic",
        "artistic",
        "leadership",
        "service",
        "technical",
        "entrepreneurial",
        "competition",
        "certification",
        "publication",
        "personal",
      ],
      course_level: [
        "regular",
        "honors",
        "ap",
        "ib",
        "dual_enrollment",
        "college",
      ],
      experience_type: [
        "work",
        "internship",
        "volunteer",
        "leadership",
        "project",
        "research",
        "creative",
        "athletic",
        "entrepreneurial",
        "caregiving",
        "self_directed",
      ],
      gpa_scale: ["4.0", "5.0", "100", "international"],
      profile_status: [
        "initial",
        "basic_complete",
        "enriched",
        "verified",
        "archived",
      ],
      time_commitment: ["minimal", "part_time", "significant", "full_time"],
      user_context: [
        "high_school_9th",
        "high_school_10th",
        "high_school_11th",
        "high_school_12th",
        "gap_year",
        "college_freshman",
        "college_sophomore",
        "college_junior",
        "college_senior",
      ],
    },
  },
} as const
