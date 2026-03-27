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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      company_info: {
        Row: {
          created_at: string
          description: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_info_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_materials: {
        Row: {
          created_at: string
          id: string
          label: string
          profile_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          profile_id: string
          url?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          profile_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_materials_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      history: {
        Row: {
          action: string
          date: string
          id: string
          profile_id: string
          user: string
        }
        Insert: {
          action: string
          date?: string
          id?: string
          profile_id: string
          user?: string
        }
        Update: {
          action?: string
          date?: string
          id?: string
          profile_id?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_metrics: {
        Row: {
          average_rating: number
          id: string
          month: number
          phone_clicks: number
          profile_id: string
          profile_views: number
          route_requests: number
          total_reviews: number
          website_clicks: number
          year: number
        }
        Insert: {
          average_rating?: number
          id?: string
          month: number
          phone_clicks?: number
          profile_id: string
          profile_views?: number
          route_requests?: number
          total_reviews?: number
          website_clicks?: number
          year: number
        }
        Update: {
          average_rating?: number
          id?: string
          month?: number
          phone_clicks?: number
          profile_id?: string
          profile_views?: number
          route_requests?: number
          total_reviews?: number
          website_clicks?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_metrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          client_comment: string | null
          created_at: string
          id: string
          image_url: string
          profile_id: string
          status: string
          text: string
        }
        Insert: {
          client_comment?: string | null
          created_at?: string
          id?: string
          image_url?: string
          profile_id: string
          status?: string
          text?: string
        }
        Update: {
          client_comment?: string | null
          created_at?: string
          id?: string
          image_url?: string
          profile_id?: string
          status?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_updates: {
        Row: {
          date: string
          description: string
          id: string
          profile_id: string
          responsible: string
        }
        Insert: {
          date?: string
          description?: string
          id?: string
          profile_id: string
          responsible?: string
        }
        Update: {
          date?: string
          description?: string
          id?: string
          profile_id?: string
          responsible?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_updates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          category: string
          city: string
          created_at: string
          id: string
          last_post_action_at: string | null
          last_post_date: string | null
          name: string
          post_frequency_days: number
          previous_post_date: string | null
          priority: string
          responsible: string
          status: string
        }
        Insert: {
          category?: string
          city?: string
          created_at?: string
          id?: string
          last_post_action_at?: string | null
          last_post_date?: string | null
          name: string
          post_frequency_days?: number
          previous_post_date?: string | null
          priority?: string
          responsible?: string
          status?: string
        }
        Update: {
          category?: string
          city?: string
          created_at?: string
          id?: string
          last_post_action_at?: string | null
          last_post_date?: string | null
          name?: string
          post_frequency_days?: number
          previous_post_date?: string | null
          priority?: string
          responsible?: string
          status?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          comment: string
          date: string
          id: string
          link: string | null
          pdf_url: string | null
          profile_id: string
        }
        Insert: {
          comment?: string
          date?: string
          id?: string
          link?: string | null
          pdf_url?: string | null
          profile_id: string
        }
        Update: {
          comment?: string
          date?: string
          id?: string
          link?: string | null
          pdf_url?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author: string
          date: string
          id: string
          profile_id: string
          rating: number
          response: string | null
          text: string
        }
        Insert: {
          author: string
          date?: string
          id?: string
          profile_id: string
          rating: number
          response?: string | null
          text?: string
        }
        Update: {
          author?: string
          date?: string
          id?: string
          profile_id?: string
          rating?: number
          response?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          date: string
          description: string
          id: string
          priority: string
          profile_id: string
          responsible: string
          status: string
          title: string
        }
        Insert: {
          date?: string
          description?: string
          id?: string
          priority?: string
          profile_id: string
          responsible?: string
          status?: string
          title: string
        }
        Update: {
          date?: string
          description?: string
          id?: string
          priority?: string
          profile_id?: string
          responsible?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_profile_id_fkey"
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
