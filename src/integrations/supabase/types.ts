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
      agents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          class_section: string | null
          created_at: string | null
          id: string
          message: string | null
          standard: string
        }
        Insert: {
          class_section?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          standard: string
        }
        Update: {
          class_section?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          standard?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          class_section: string
          created_at: string | null
          date: string | null
          id: string
          message: string | null
          standard: string
          student_id: string | null
        }
        Insert: {
          class_section: string
          created_at?: string | null
          date?: string | null
          id?: string
          message?: string | null
          standard: string
          student_id?: string | null
        }
        Update: {
          class_section?: string
          created_at?: string | null
          date?: string | null
          id?: string
          message?: string | null
          standard?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fees_reminders: {
        Row: {
          class_section: string
          created_at: string | null
          id: string
          message: string | null
          standard: string
          student_id: string | null
        }
        Insert: {
          class_section: string
          created_at?: string | null
          id?: string
          message?: string | null
          standard: string
          student_id?: string | null
        }
        Update: {
          class_section?: string
          created_at?: string | null
          id?: string
          message?: string | null
          standard?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fees_reminders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          class_section: string
          created_at: string | null
          file_url: string | null
          id: string
          notes: string | null
          standard: string
          teacher_id: string | null
        }
        Insert: {
          class_section: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          standard: string
          teacher_id?: string | null
        }
        Update: {
          class_section?: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          standard?: string
          teacher_id?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string | null
          current_class: string | null
          id: string
          new_class: string | null
          status: string | null
          student_id: string | null
          year: string | null
        }
        Insert: {
          created_at?: string | null
          current_class?: string | null
          id?: string
          new_class?: string | null
          status?: string | null
          student_id?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string | null
          current_class?: string | null
          id?: string
          new_class?: string | null
          status?: string | null
          student_id?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          class_section: string
          created_at: string | null
          date: string | null
          id: string
          marks: number | null
          photo_url: string | null
          standard: string
          student_id: string | null
          subject: string | null
          total_marks: number | null
        }
        Insert: {
          class_section: string
          created_at?: string | null
          date?: string | null
          id?: string
          marks?: number | null
          photo_url?: string | null
          standard: string
          student_id?: string | null
          subject?: string | null
          total_marks?: number | null
        }
        Update: {
          class_section?: string
          created_at?: string | null
          date?: string | null
          id?: string
          marks?: number | null
          photo_url?: string | null
          standard?: string
          student_id?: string | null
          subject?: string | null
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_section: string
          created_at: string | null
          id: string
          name: string
          parent_name: string | null
          parent_phone: string | null
          photo_url: string | null
          standard: string
        }
        Insert: {
          class_section: string
          created_at?: string | null
          id?: string
          name: string
          parent_name?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          standard: string
        }
        Update: {
          class_section?: string
          created_at?: string | null
          id?: string
          name?: string
          parent_name?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          standard?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          created_at: string | null
          id: string
          message_type: string | null
          recipient: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_type?: string | null
          recipient?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_type?: string | null
          recipient?: string | null
          status?: string | null
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
  public: {
    Enums: {},
  },
} as const
