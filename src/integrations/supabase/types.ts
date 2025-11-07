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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      contact_activities: {
        Row: {
          activity_description: string
          activity_type: string
          contact_id: string
          created_at: string
          id: string
          lead_id: string
          new_value: string | null
          previous_value: string | null
          user_id: string
        }
        Insert: {
          activity_description: string
          activity_type: string
          contact_id: string
          created_at?: string
          id?: string
          lead_id: string
          new_value?: string | null
          previous_value?: string | null
          user_id: string
        }
        Update: {
          activity_description?: string
          activity_type?: string
          contact_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          new_value?: string | null
          previous_value?: string | null
          user_id?: string
        }
        Relationships: []
      }
      job_functions: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      lead_contacts: {
        Row: {
          created_at: string
          email: string | null
          engagement_date: string | null
          follow_up_date: string | null
          full_name: string
          id: string
          is_email_discovered: boolean | null
          is_phone_discovered: boolean | null
          lead_id: string
          linkedin: string | null
          note: string | null
          persona_position: number | null
          phone: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          engagement_date?: string | null
          follow_up_date?: string | null
          full_name: string
          id?: string
          is_email_discovered?: boolean | null
          is_phone_discovered?: boolean | null
          lead_id: string
          linkedin?: string | null
          note?: string | null
          persona_position?: number | null
          phone?: string | null
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          engagement_date?: string | null
          follow_up_date?: string | null
          full_name?: string
          id?: string
          is_email_discovered?: boolean | null
          is_phone_discovered?: boolean | null
          lead_id?: string
          linkedin?: string | null
          note?: string | null
          persona_position?: number | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company_address: string | null
          company_ca: number | null
          company_department: string | null
          company_headcount: number | null
          company_id: string
          company_linkedin: string | null
          company_naf: string | null
          company_name: string
          company_sector: string | null
          company_siret: string | null
          company_website: string | null
          created_at: string
          id: string
          is_hot_signal: boolean | null
          news_content: string | null
          signal_summary: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_address?: string | null
          company_ca?: number | null
          company_department?: string | null
          company_headcount?: number | null
          company_id: string
          company_linkedin?: string | null
          company_naf?: string | null
          company_name: string
          company_sector?: string | null
          company_siret?: string | null
          company_website?: string | null
          created_at?: string
          id?: string
          is_hot_signal?: boolean | null
          news_content?: string | null
          signal_summary?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_address?: string | null
          company_ca?: number | null
          company_department?: string | null
          company_headcount?: number | null
          company_id?: string
          company_linkedin?: string | null
          company_naf?: string | null
          company_name?: string
          company_sector?: string | null
          company_siret?: string | null
          company_website?: string | null
          created_at?: string
          id?: string
          is_hot_signal?: boolean | null
          news_content?: string | null
          signal_summary?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personas: {
        Row: {
          created_at: string | null
          decision_level: Database["public"]["Enums"]["decision_level"]
          id: string
          name: string
          position: number | null
          service: Database["public"]["Enums"]["persona_service"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          decision_level: Database["public"]["Enums"]["decision_level"]
          id?: string
          name: string
          position?: number | null
          service: Database["public"]["Enums"]["persona_service"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          decision_level?: Database["public"]["Enums"]["decision_level"]
          id?: string
          name?: string
          position?: number | null
          service?: Database["public"]["Enums"]["persona_service"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_address: string | null
          company_name: string | null
          company_siret: string | null
          company_type: string | null
          created_at: string | null
          crm_tool: string | null
          email: string | null
          first_name: string | null
          growth_type: string | null
          id: string
          job_function: string | null
          job_level: string | null
          last_name: string | null
          onboarding_completed: boolean | null
          other_tools: string[] | null
          peak_activity_period: string | null
          phone: string | null
          product_description: string | null
          tracked_events: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_address?: string | null
          company_name?: string | null
          company_siret?: string | null
          company_type?: string | null
          created_at?: string | null
          crm_tool?: string | null
          email?: string | null
          first_name?: string | null
          growth_type?: string | null
          id?: string
          job_function?: string | null
          job_level?: string | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          other_tools?: string[] | null
          peak_activity_period?: string | null
          phone?: string | null
          product_description?: string | null
          tracked_events?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_address?: string | null
          company_name?: string | null
          company_siret?: string | null
          company_type?: string | null
          created_at?: string | null
          crm_tool?: string | null
          email?: string | null
          first_name?: string | null
          growth_type?: string | null
          id?: string
          job_function?: string | null
          job_level?: string | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          other_tools?: string[] | null
          peak_activity_period?: string | null
          phone?: string | null
          product_description?: string | null
          tracked_events?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sequence_analytics: {
        Row: {
          created_at: string
          enrollment_id: string
          event_date: string
          event_type: string
          id: string
          sequence_id: string
          step_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          event_date?: string
          event_type: string
          id?: string
          sequence_id: string
          step_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          event_date?: string
          event_type?: string
          id?: string
          sequence_id?: string
          step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_analytics_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_analytics_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_analytics_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_enrollments: {
        Row: {
          completed_at: string | null
          contact_id: string
          created_at: string
          current_step: number
          enrolled_at: string
          id: string
          sequence_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id: string
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          sequence_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          sequence_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "lead_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_steps: {
        Row: {
          created_at: string
          delay_unit: string | null
          delay_value: number | null
          email_body: string | null
          email_subject: string | null
          id: string
          sender_email: string | null
          sequence_id: string
          step_order: number
          step_type: string
          updated_at: string
          whatsapp_audio_url: string | null
          whatsapp_message: string | null
        }
        Insert: {
          created_at?: string
          delay_unit?: string | null
          delay_value?: number | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          sender_email?: string | null
          sequence_id: string
          step_order: number
          step_type: string
          updated_at?: string
          whatsapp_audio_url?: string | null
          whatsapp_message?: string | null
        }
        Update: {
          created_at?: string
          delay_unit?: string | null
          delay_value?: number | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          sender_email?: string | null
          sequence_id?: string
          step_order?: number
          step_type?: string
          updated_at?: string
          whatsapp_audio_url?: string | null
          whatsapp_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      targetings: {
        Row: {
          created_at: string | null
          departments: string[] | null
          id: string
          is_active: boolean | null
          max_headcount: number | null
          max_revenue: number | null
          min_headcount: number | null
          min_revenue: number | null
          name: string
          sectors: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          departments?: string[] | null
          id?: string
          is_active?: boolean | null
          max_headcount?: number | null
          max_revenue?: number | null
          min_headcount?: number | null
          min_revenue?: number | null
          name: string
          sectors?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          departments?: string[] | null
          id?: string
          is_active?: boolean | null
          max_headcount?: number | null
          max_revenue?: number | null
          min_headcount?: number | null
          min_revenue?: number | null
          name?: string
          sectors?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          credits: number | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          credits?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          credits?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
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
      decision_level:
        | "Dirigeant"
        | "Directeur / Responsable"
        | "Autres collaborateurs"
      persona_service:
        | "Direction"
        | "Commerce"
        | "Marketing"
        | "Comptabilité / Finance"
        | "IT"
        | "RH"
        | "Juridique"
        | "R&D"
        | "Production"
        | "Logistique"
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
      decision_level: [
        "Dirigeant",
        "Directeur / Responsable",
        "Autres collaborateurs",
      ],
      persona_service: [
        "Direction",
        "Commerce",
        "Marketing",
        "Comptabilité / Finance",
        "IT",
        "RH",
        "Juridique",
        "R&D",
        "Production",
        "Logistique",
      ],
    },
  },
} as const
