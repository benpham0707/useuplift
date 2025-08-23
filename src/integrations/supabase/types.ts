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
      academic_records: {
        Row: {
          academic_honors: string[]
          academic_interests: string[]
          class_rank: number | null
          class_size: number | null
          coursework: Json
          created_at: string
          current_grade: string
          gpa: number | null
          gpa_scale: Database["public"]["Enums"]["gpa_scale"]
          id: string
          planned_courses: Json
          profile_id: string
          school: Json
          standardized_tests: Json
          strong_subjects: string[]
          struggling_subjects: string[]
          summer_programs: string[]
          updated_at: string
          weighted_gpa: number | null
        }
        Insert: {
          academic_honors?: string[]
          academic_interests?: string[]
          class_rank?: number | null
          class_size?: number | null
          coursework?: Json
          created_at?: string
          current_grade: string
          gpa?: number | null
          gpa_scale?: Database["public"]["Enums"]["gpa_scale"]
          id?: string
          planned_courses?: Json
          profile_id: string
          school?: Json
          standardized_tests?: Json
          strong_subjects?: string[]
          struggling_subjects?: string[]
          summer_programs?: string[]
          updated_at?: string
          weighted_gpa?: number | null
        }
        Update: {
          academic_honors?: string[]
          academic_interests?: string[]
          class_rank?: number | null
          class_size?: number | null
          coursework?: Json
          created_at?: string
          current_grade?: string
          gpa?: number | null
          gpa_scale?: Database["public"]["Enums"]["gpa_scale"]
          id?: string
          planned_courses?: Json
          profile_id?: string
          school?: Json
          standardized_tests?: Json
          strong_subjects?: string[]
          struggling_subjects?: string[]
          summer_programs?: string[]
          updated_at?: string
          weighted_gpa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          character_traits: string[]
          context: Json
          created_at: string
          criteria: string | null
          date_received: string
          deleted_at: string | null
          description: string
          document_url: string | null
          enhanced_description: string | null
          id: string
          impact: Database["public"]["Enums"]["achievement_impact"]
          is_underrecognized: boolean
          metrics: Json
          organization: string
          profile_id: string
          relevance_scores: Json
          requires_context: boolean
          scope: Database["public"]["Enums"]["achievement_scope"]
          search_vector: unknown | null
          skills_demonstrated: string[]
          suggested_narratives: string[]
          title: string
          type: Database["public"]["Enums"]["achievement_type"]
          updated_at: string
          verification_url: string | null
        }
        Insert: {
          character_traits?: string[]
          context?: Json
          created_at?: string
          criteria?: string | null
          date_received: string
          deleted_at?: string | null
          description: string
          document_url?: string | null
          enhanced_description?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["achievement_impact"]
          is_underrecognized?: boolean
          metrics?: Json
          organization: string
          profile_id: string
          relevance_scores?: Json
          requires_context?: boolean
          scope: Database["public"]["Enums"]["achievement_scope"]
          search_vector?: unknown | null
          skills_demonstrated?: string[]
          suggested_narratives?: string[]
          title: string
          type: Database["public"]["Enums"]["achievement_type"]
          updated_at?: string
          verification_url?: string | null
        }
        Update: {
          character_traits?: string[]
          context?: Json
          created_at?: string
          criteria?: string | null
          date_received?: string
          deleted_at?: string | null
          description?: string
          document_url?: string | null
          enhanced_description?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["achievement_impact"]
          is_underrecognized?: boolean
          metrics?: Json
          organization?: string
          profile_id?: string
          relevance_scores?: Json
          requires_context?: boolean
          scope?: Database["public"]["Enums"]["achievement_scope"]
          search_vector?: unknown | null
          skills_demonstrated?: string[]
          suggested_narratives?: string[]
          title?: string
          type?: Database["public"]["Enums"]["achievement_type"]
          updated_at?: string
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_analysis_cache: {
        Row: {
          analysis_result: Json
          analysis_type: string
          confidence_score: number | null
          created_at: string
          expires_at: string
          id: string
          model_version: string
          profile_id: string
        }
        Insert: {
          analysis_result: Json
          analysis_type: string
          confidence_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          model_version: string
          profile_id: string
        }
        Update: {
          analysis_result?: Json
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          model_version?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_cache_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          completed_at: string | null
          completion_rate: number
          created_at: string
          expires_at: string
          id: string
          insights: Json
          profile_id: string | null
          questions_answered: number
          responses: Json
          session_type: string
          started_at: string
          total_questions: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_rate?: number
          created_at?: string
          expires_at?: string
          id?: string
          insights?: Json
          profile_id?: string | null
          questions_answered?: number
          responses?: Json
          session_type?: string
          started_at?: string
          total_questions?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_rate?: number
          created_at?: string
          expires_at?: string
          id?: string
          insights?: Json
          profile_id?: string | null
          questions_answered?: number
          responses?: Json
          session_type?: string
          started_at?: string
          total_questions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_sessions: {
        Row: {
          achievements_unlocked: string[]
          completion_rate: number
          created_at: string
          ended_at: string | null
          id: string
          items_completed: string[]
          points_earned: number
          profile_id: string
          session_type: string
          started_at: string
        }
        Insert: {
          achievements_unlocked?: string[]
          completion_rate?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          items_completed?: string[]
          points_earned?: number
          profile_id: string
          session_type: string
          started_at?: string
        }
        Update: {
          achievements_unlocked?: string[]
          completion_rate?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          items_completed?: string[]
          points_earned?: number
          profile_id?: string
          session_type?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          achievements: string[]
          ai_extracted_themes: string[]
          can_contact: boolean
          challenges: string[]
          college_relevance_score: number | null
          created_at: string
          deleted_at: string | null
          description: string
          end_date: string | null
          id: string
          is_ongoing: boolean
          leadership_examples: string[]
          lessons_learned: string[]
          metrics: Json
          narrative_summary: string | null
          organization: string
          problem_solving_examples: string[]
          profile_id: string
          responsibilities: string[]
          search_vector: unknown | null
          skills_demonstrated: Json
          start_date: string
          supervisor_name: string | null
          time_commitment: Database["public"]["Enums"]["time_commitment"]
          title: string
          tools_used: string[]
          total_hours: number | null
          transferable_skills: string[]
          type: Database["public"]["Enums"]["experience_type"]
          updated_at: string
          verification_url: string | null
        }
        Insert: {
          achievements?: string[]
          ai_extracted_themes?: string[]
          can_contact?: boolean
          challenges?: string[]
          college_relevance_score?: number | null
          created_at?: string
          deleted_at?: string | null
          description: string
          end_date?: string | null
          id?: string
          is_ongoing?: boolean
          leadership_examples?: string[]
          lessons_learned?: string[]
          metrics?: Json
          narrative_summary?: string | null
          organization: string
          problem_solving_examples?: string[]
          profile_id: string
          responsibilities?: string[]
          search_vector?: unknown | null
          skills_demonstrated?: Json
          start_date: string
          supervisor_name?: string | null
          time_commitment: Database["public"]["Enums"]["time_commitment"]
          title: string
          tools_used?: string[]
          total_hours?: number | null
          transferable_skills?: string[]
          type: Database["public"]["Enums"]["experience_type"]
          updated_at?: string
          verification_url?: string | null
        }
        Update: {
          achievements?: string[]
          ai_extracted_themes?: string[]
          can_contact?: boolean
          challenges?: string[]
          college_relevance_score?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          end_date?: string | null
          id?: string
          is_ongoing?: boolean
          leadership_examples?: string[]
          lessons_learned?: string[]
          metrics?: Json
          narrative_summary?: string | null
          organization?: string
          problem_solving_examples?: string[]
          profile_id?: string
          responsibilities?: string[]
          search_vector?: unknown | null
          skills_demonstrated?: Json
          start_date?: string
          supervisor_name?: string | null
          time_commitment?: Database["public"]["Enums"]["time_commitment"]
          title?: string
          tools_used?: string[]
          total_hours?: number | null
          transferable_skills?: string[]
          type?: Database["public"]["Enums"]["experience_type"]
          updated_at?: string
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          ip_address: unknown | null
          profile_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          ip_address?: unknown | null
          profile_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          ip_address?: unknown | null
          profile_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          category: string
          confidence: number
          created_at: string
          evidence: string[]
          id: string
          profile_id: string
          skill: string
          source_id: string | null
          source_type: string
          updated_at: string
        }
        Insert: {
          category: string
          confidence: number
          created_at?: string
          evidence?: string[]
          id?: string
          profile_id: string
          skill: string
          source_id?: string | null
          source_type: string
          updated_at?: string
        }
        Update: {
          category?: string
          confidence?: number
          created_at?: string
          evidence?: string[]
          id?: string
          profile_id?: string
          skill?: string
          source_id?: string | null
          source_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
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
