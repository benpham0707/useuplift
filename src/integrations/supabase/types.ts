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
  college_ingest: {
    Tables: {
      ingestion_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          diagnostic_summary: Json
          finished_at: string | null
          id: string
          ingestion_job_id: string
          started_at: string
          status: string
        }
        Insert: {
          attempt_number: number
          created_at?: string
          diagnostic_summary?: Json
          finished_at?: string | null
          id?: string
          ingestion_job_id: string
          started_at?: string
          status?: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          diagnostic_summary?: Json
          finished_at?: string | null
          id?: string
          ingestion_job_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_attempts_ingestion_job_id_fkey"
            columns: ["ingestion_job_id"]
            isOneToOne: false
            referencedRelation: "ingestion_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_jobs: {
        Row: {
          created_at: string
          error_summary: string | null
          finished_at: string | null
          id: string
          pipeline_build_id: string
          release_id: string
          rows_accepted: number
          rows_read: number
          rows_rejected: number
          started_at: string | null
          status: string
          validation_summary: Json
        }
        Insert: {
          created_at?: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          pipeline_build_id: string
          release_id: string
          rows_accepted?: number
          rows_read?: number
          rows_rejected?: number
          started_at?: string | null
          status?: string
          validation_summary?: Json
        }
        Update: {
          created_at?: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          pipeline_build_id?: string
          release_id?: string
          rows_accepted?: number
          rows_read?: number
          rows_rejected?: number
          started_at?: string | null
          status?: string
          validation_summary?: Json
        }
        Relationships: []
      }
      staged_institutions: {
        Row: {
          city: string | null
          created_at: string
          ingestion_job_id: string
          institution_level: string
          is_eligible: boolean
          latitude: number | null
          longitude: number | null
          official_name: string
          ownership: string
          source_record_locator: string
          state: string | null
          status: string
          unitid: number
          website_url: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          ingestion_job_id: string
          institution_level: string
          is_eligible: boolean
          latitude?: number | null
          longitude?: number | null
          official_name: string
          ownership: string
          source_record_locator: string
          state?: string | null
          status: string
          unitid: number
          website_url?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          ingestion_job_id?: string
          institution_level?: string
          is_eligible?: boolean
          latitude?: number | null
          longitude?: number | null
          official_name?: string
          ownership?: string
          source_record_locator?: string
          state?: string | null
          status?: string
          unitid?: number
          website_url?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staged_institutions_ingestion_job_id_fkey"
            columns: ["ingestion_job_id"]
            isOneToOne: false
            referencedRelation: "ingestion_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      staged_metric_facts: {
        Row: {
          academic_year: number
          cohort_key: string
          created_at: string
          ingestion_job_id: string
          is_suppressed: boolean
          metric_key: string
          source_record_locator: string
          unit: string
          unitid: number
          value_numeric: number | null
        }
        Insert: {
          academic_year: number
          cohort_key?: string
          created_at?: string
          ingestion_job_id: string
          is_suppressed?: boolean
          metric_key: string
          source_record_locator: string
          unit: string
          unitid: number
          value_numeric?: number | null
        }
        Update: {
          academic_year?: number
          cohort_key?: string
          created_at?: string
          ingestion_job_id?: string
          is_suppressed?: boolean
          metric_key?: string
          source_record_locator?: string
          unit?: string
          unitid?: number
          value_numeric?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staged_metric_facts_ingestion_job_id_fkey"
            columns: ["ingestion_job_id"]
            isOneToOne: false
            referencedRelation: "ingestion_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_college_projection: {
        Args: { p_projection_version_id: string }
        Returns: Json
      }
      build_college_projection: {
        Args: {
          p_field_manifest_version: string
          p_projection_build_id: string
        }
        Returns: Json
      }
      promote_ingestion_job: {
        Args: { p_ingestion_job_id: string }
        Returns: Json
      }
      restore_ipeds_canonical_identity: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      college_profile_fact_candidates: {
        Row: {
          attribute_fact_id: string | null
          candidate_ordinal: number
          created_at: string
          field_key: string
          institution_id: string
          metric_fact_id: string | null
          projection_version_id: string
        }
        Insert: {
          attribute_fact_id?: string | null
          candidate_ordinal: number
          created_at?: string
          field_key: string
          institution_id: string
          metric_fact_id?: string | null
          projection_version_id: string
        }
        Update: {
          attribute_fact_id?: string | null
          candidate_ordinal?: number
          created_at?: string
          field_key?: string
          institution_id?: string
          metric_fact_id?: string | null
          projection_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_profile_fact_candidat_projection_version_id_instit_fkey"
            columns: ["projection_version_id", "institution_id", "field_key"]
            isOneToOne: false
            referencedRelation: "college_profile_facts"
            referencedColumns: [
              "projection_version_id",
              "institution_id",
              "field_key",
            ]
          },
          {
            foreignKeyName: "college_profile_fact_candidates_attribute_fact_id_fkey"
            columns: ["attribute_fact_id"]
            isOneToOne: false
            referencedRelation: "institution_attribute_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_profile_fact_candidates_metric_fact_id_fkey"
            columns: ["metric_fact_id"]
            isOneToOne: false
            referencedRelation: "institution_metric_facts"
            referencedColumns: ["id"]
          },
        ]
      }
      college_profile_facts: {
        Row: {
          academic_year: number | null
          attribute_fact_id: string | null
          cohort_key: string | null
          cohort_label: string | null
          created_at: string
          display_value: string | null
          field_key: string
          institution_id: string
          is_estimate: boolean
          is_suppressed: boolean
          metric_fact_id: string | null
          period_end: string | null
          period_start: string | null
          projection_version_id: string
          quality_status: string
          retrieved_at: string | null
          source_name: string | null
          source_record_locator: string | null
          source_release: string | null
        }
        Insert: {
          academic_year?: number | null
          attribute_fact_id?: string | null
          cohort_key?: string | null
          cohort_label?: string | null
          created_at?: string
          display_value?: string | null
          field_key: string
          institution_id: string
          is_estimate?: boolean
          is_suppressed?: boolean
          metric_fact_id?: string | null
          period_end?: string | null
          period_start?: string | null
          projection_version_id: string
          quality_status: string
          retrieved_at?: string | null
          source_name?: string | null
          source_record_locator?: string | null
          source_release?: string | null
        }
        Update: {
          academic_year?: number | null
          attribute_fact_id?: string | null
          cohort_key?: string | null
          cohort_label?: string | null
          created_at?: string
          display_value?: string | null
          field_key?: string
          institution_id?: string
          is_estimate?: boolean
          is_suppressed?: boolean
          metric_fact_id?: string | null
          period_end?: string | null
          period_start?: string | null
          projection_version_id?: string
          quality_status?: string
          retrieved_at?: string | null
          source_name?: string | null
          source_record_locator?: string | null
          source_release?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "college_profile_facts_attribute_fact_id_fkey"
            columns: ["attribute_fact_id"]
            isOneToOne: false
            referencedRelation: "institution_attribute_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_profile_facts_metric_fact_id_fkey"
            columns: ["metric_fact_id"]
            isOneToOne: false
            referencedRelation: "institution_metric_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_profile_facts_projection_version_id_institution_id_fkey"
            columns: ["projection_version_id", "institution_id"]
            isOneToOne: false
            referencedRelation: "college_profiles"
            referencedColumns: ["projection_version_id", "institution_id"]
          },
        ]
      }
      college_profiles: {
        Row: {
          admission_rate: number | null
          aliases: string[]
          city: string | null
          coverage_score: number
          generated_at: string
          institution_id: string
          institution_level: string
          name: string
          net_price: number | null
          normalized_name: string
          ownership: string
          projection_version_id: string
          search_document: unknown
          setting: string | null
          slug: string
          state: string | null
          tuition_in_state: number | null
          tuition_out_of_state: number | null
          undergraduate_enrollment: number | null
          unitid: number
          zip: string | null
        }
        Insert: {
          admission_rate?: number | null
          aliases?: string[]
          city?: string | null
          coverage_score?: number
          generated_at?: string
          institution_id: string
          institution_level: string
          name: string
          net_price?: number | null
          normalized_name: string
          ownership: string
          projection_version_id: string
          search_document: unknown
          setting?: string | null
          slug: string
          state?: string | null
          tuition_in_state?: number | null
          tuition_out_of_state?: number | null
          undergraduate_enrollment?: number | null
          unitid: number
          zip?: string | null
        }
        Update: {
          admission_rate?: number | null
          aliases?: string[]
          city?: string | null
          coverage_score?: number
          generated_at?: string
          institution_id?: string
          institution_level?: string
          name?: string
          net_price?: number | null
          normalized_name?: string
          ownership?: string
          projection_version_id?: string
          search_document?: unknown
          setting?: string | null
          slug?: string
          state?: string | null
          tuition_in_state?: number | null
          tuition_out_of_state?: number | null
          undergraduate_enrollment?: number | null
          unitid?: number
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "college_profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_profiles_projection_version_id_fkey"
            columns: ["projection_version_id"]
            isOneToOne: false
            referencedRelation: "projection_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      data_quality_issues: {
        Row: {
          created_at: string
          details: Json
          field_key: string | null
          id: string
          institution_id: string | null
          issue_type: string
          release_id: string
          resolved_at: string | null
          severity: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json
          field_key?: string | null
          id?: string
          institution_id?: string | null
          issue_type: string
          release_id: string
          resolved_at?: string | null
          severity: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: Json
          field_key?: string | null
          id?: string
          institution_id?: string | null
          issue_type?: string
          release_id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_quality_issues_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_quality_issues_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "data_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      data_releases: {
        Row: {
          created_at: string
          data_source_id: string
          id: string
          metadata: Json
          object_path: string
          release_type: string
          retrieved_at: string
          schema_version: string
          sha256: string
          source_published_at: string | null
          source_release_name: string
          source_url: string
        }
        Insert: {
          created_at?: string
          data_source_id: string
          id?: string
          metadata?: Json
          object_path: string
          release_type: string
          retrieved_at: string
          schema_version: string
          sha256: string
          source_published_at?: string | null
          source_release_name: string
          source_url: string
        }
        Update: {
          created_at?: string
          data_source_id?: string
          id?: string
          metadata?: Json
          object_path?: string
          release_type?: string
          retrieved_at?: string
          schema_version?: string
          sha256?: string
          source_published_at?: string | null
          source_release_name?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_releases_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          created_at: string
          dataset_name: string
          description: string | null
          homepage_url: string
          id: string
          producer_name: string
          source_key: string
        }
        Insert: {
          created_at?: string
          dataset_name: string
          description?: string | null
          homepage_url: string
          id?: string
          producer_name: string
          source_key: string
        }
        Update: {
          created_at?: string
          dataset_name?: string
          description?: string | null
          homepage_url?: string
          id?: string
          producer_name?: string
          source_key?: string
        }
        Relationships: []
      }
      institution_attribute_facts: {
        Row: {
          attribute_key: string
          created_at: string
          id: string
          institution_id: string
          quality_status: string
          release_id: string
          reporting_period_end: string | null
          reporting_period_start: string | null
          source_record_locator: string
          value_boolean: boolean | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          attribute_key: string
          created_at?: string
          id?: string
          institution_id: string
          quality_status?: string
          release_id: string
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          source_record_locator: string
          value_boolean?: boolean | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          attribute_key?: string
          created_at?: string
          id?: string
          institution_id?: string
          quality_status?: string
          release_id?: string
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          source_record_locator?: string
          value_boolean?: boolean | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_attribute_facts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_attribute_facts_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "data_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_identifiers: {
        Row: {
          created_at: string
          institution_id: string
          scheme: string
          source_release_id: string
          valid_from: string
          valid_to: string | null
          value: string
        }
        Insert: {
          created_at?: string
          institution_id: string
          scheme: string
          source_release_id: string
          valid_from: string
          valid_to?: string | null
          value: string
        }
        Update: {
          created_at?: string
          institution_id?: string
          scheme?: string
          source_release_id?: string
          valid_from?: string
          valid_to?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_identifiers_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_identifiers_source_release_id_fkey"
            columns: ["source_release_id"]
            isOneToOne: false
            referencedRelation: "data_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_lookup: {
        Row: {
          aliases: string[]
          canonical_slug: string
          created_at: string
          institution_id: string
          known_status: string
          projection_version_id: string
          search_document: unknown
          slug: string
        }
        Insert: {
          aliases?: string[]
          canonical_slug: string
          created_at?: string
          institution_id: string
          known_status: string
          projection_version_id: string
          search_document: unknown
          slug: string
        }
        Update: {
          aliases?: string[]
          canonical_slug?: string
          created_at?: string
          institution_id?: string
          known_status?: string
          projection_version_id?: string
          search_document?: unknown
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_lookup_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_lookup_projection_version_id_fkey"
            columns: ["projection_version_id"]
            isOneToOne: false
            referencedRelation: "projection_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_metric_facts: {
        Row: {
          academic_year: number
          cohort_key: string
          created_at: string
          id: string
          institution_id: string
          is_suppressed: boolean
          metric_definition_id: string
          quality_status: string
          release_id: string
          source_record_locator: string
          unit: string
          value_numeric: number | null
        }
        Insert: {
          academic_year: number
          cohort_key?: string
          created_at?: string
          id?: string
          institution_id: string
          is_suppressed?: boolean
          metric_definition_id: string
          quality_status?: string
          release_id: string
          source_record_locator: string
          unit: string
          value_numeric?: number | null
        }
        Update: {
          academic_year?: number
          cohort_key?: string
          created_at?: string
          id?: string
          institution_id?: string
          is_suppressed?: boolean
          metric_definition_id?: string
          quality_status?: string
          release_id?: string
          source_record_locator?: string
          unit?: string
          value_numeric?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_metric_facts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_metric_facts_metric_definition_id_fkey"
            columns: ["metric_definition_id"]
            isOneToOne: false
            referencedRelation: "metric_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_metric_facts_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "data_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_relationships: {
        Row: {
          child_institution_id: string
          created_at: string
          parent_institution_id: string
          relationship_type: string
          source_release_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          child_institution_id: string
          created_at?: string
          parent_institution_id: string
          relationship_type: string
          source_release_id: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          child_institution_id?: string
          created_at?: string
          parent_institution_id?: string
          relationship_type?: string
          source_release_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_relationships_child_institution_id_fkey"
            columns: ["child_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_relationships_parent_institution_id_fkey"
            columns: ["parent_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_relationships_source_release_id_fkey"
            columns: ["source_release_id"]
            isOneToOne: false
            referencedRelation: "data_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          city: string | null
          created_at: string
          id: string
          institution_level: string
          latitude: number | null
          longitude: number | null
          official_name: string
          ownership: string
          state: string | null
          status: string
          unitid: number
          updated_at: string
          website_url: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          institution_level: string
          latitude?: number | null
          longitude?: number | null
          official_name: string
          ownership: string
          state?: string | null
          status?: string
          unitid: number
          updated_at?: string
          website_url?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          institution_level?: string
          latitude?: number | null
          longitude?: number | null
          official_name?: string
          ownership?: string
          state?: string | null
          status?: string
          unitid?: number
          updated_at?: string
          website_url?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      metric_definitions: {
        Row: {
          cohort_semantics: string
          created_at: string
          id: string
          is_student_visible: boolean
          maximum_value: number | null
          metric_key: string
          minimum_value: number | null
          source_precedence: Json
          student_label: string
          unit: string
          value_type: string
        }
        Insert: {
          cohort_semantics: string
          created_at?: string
          id?: string
          is_student_visible?: boolean
          maximum_value?: number | null
          metric_key: string
          minimum_value?: number | null
          source_precedence: Json
          student_label: string
          unit: string
          value_type?: string
        }
        Update: {
          cohort_semantics?: string
          created_at?: string
          id?: string
          is_student_visible?: boolean
          maximum_value?: number | null
          metric_key?: string
          minimum_value?: number | null
          source_precedence?: Json
          student_label?: string
          unit?: string
          value_type?: string
        }
        Relationships: []
      }
      projection_control: {
        Row: {
          active_projection_version_id: string | null
          singleton: boolean
          updated_at: string
        }
        Insert: {
          active_projection_version_id?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          active_projection_version_id?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projection_control_active_projection_version_id_fkey"
            columns: ["active_projection_version_id"]
            isOneToOne: false
            referencedRelation: "projection_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      projection_version_releases: {
        Row: {
          created_at: string
          projection_version_id: string
          release_id: string
        }
        Insert: {
          created_at?: string
          projection_version_id: string
          release_id: string
        }
        Update: {
          created_at?: string
          projection_version_id?: string
          release_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projection_version_releases_projection_version_id_fkey"
            columns: ["projection_version_id"]
            isOneToOne: false
            referencedRelation: "projection_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projection_version_releases_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "data_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      projection_versions: {
        Row: {
          activated_at: string | null
          build_summary: Json
          created_at: string
          field_manifest_version: string
          id: string
          projection_build_id: string
          retired_at: string | null
          row_count: number
          status: string
          validated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          build_summary?: Json
          created_at?: string
          field_manifest_version: string
          id?: string
          projection_build_id: string
          retired_at?: string | null
          row_count?: number
          status?: string
          validated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          build_summary?: Json
          created_at?: string
          field_manifest_version?: string
          id?: string
          projection_build_id?: string
          retired_at?: string | null
          row_count?: number
          status?: string
          validated_at?: string | null
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
  college_ingest: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
