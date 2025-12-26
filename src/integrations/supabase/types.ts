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
      agent_profiles: {
        Row: {
          brokerage_address: string | null
          brokerage_name: string
          created_at: string
          id: string
          license_number: string
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["agent_verification_status"]
          verified_at: string | null
        }
        Insert: {
          brokerage_address?: string | null
          brokerage_name: string
          created_at?: string
          id?: string
          license_number: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["agent_verification_status"]
          verified_at?: string | null
        }
        Update: {
          brokerage_address?: string | null
          brokerage_name?: string
          created_at?: string
          id?: string
          license_number?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["agent_verification_status"]
          verified_at?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      leads: {
        Row: {
          agent_id: string
          created_at: string
          email: string
          id: string
          listing_id: string
          message: string | null
          name: string
          phone: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          email: string
          id?: string
          listing_id: string
          message?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          email?: string
          id?: string
          listing_id?: string
          message?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_files: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string
          id: string
          listing_id: string
          url: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type?: string
          id?: string
          listing_id: string
          url: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string
          id?: string
          listing_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_files_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          agent_id: string
          amenities: string[] | null
          assignment_fee: number | null
          assignment_price: number
          baths: number
          beds: number
          city: string
          closing_date: string | null
          completion_month: number | null
          completion_year: number | null
          construction_status: Database["public"]["Enums"]["construction_status"]
          created_at: string
          deposit_paid: number | null
          description: string | null
          developer_name: string | null
          expires_at: string | null
          exposure: string | null
          exterior_sqft: number | null
          floor_level: number | null
          has_parking: boolean | null
          has_storage: boolean | null
          id: string
          interior_sqft: number | null
          is_featured: boolean | null
          neighborhood: string | null
          occupancy_date: string | null
          original_price: number | null
          parking_count: number | null
          project_name: string
          property_type: Database["public"]["Enums"]["property_type"]
          published_at: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          agent_id: string
          amenities?: string[] | null
          assignment_fee?: number | null
          assignment_price: number
          baths?: number
          beds?: number
          city: string
          closing_date?: string | null
          completion_month?: number | null
          completion_year?: number | null
          construction_status?: Database["public"]["Enums"]["construction_status"]
          created_at?: string
          deposit_paid?: number | null
          description?: string | null
          developer_name?: string | null
          expires_at?: string | null
          exposure?: string | null
          exterior_sqft?: number | null
          floor_level?: number | null
          has_parking?: boolean | null
          has_storage?: boolean | null
          id?: string
          interior_sqft?: number | null
          is_featured?: boolean | null
          neighborhood?: string | null
          occupancy_date?: string | null
          original_price?: number | null
          parking_count?: number | null
          project_name: string
          property_type?: Database["public"]["Enums"]["property_type"]
          published_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          agent_id?: string
          amenities?: string[] | null
          assignment_fee?: number | null
          assignment_price?: number
          baths?: number
          beds?: number
          city?: string
          closing_date?: string | null
          completion_month?: number | null
          completion_year?: number | null
          construction_status?: Database["public"]["Enums"]["construction_status"]
          created_at?: string
          deposit_paid?: number | null
          description?: string | null
          developer_name?: string | null
          expires_at?: string | null
          exposure?: string | null
          exterior_sqft?: number | null
          floor_level?: number | null
          has_parking?: boolean | null
          has_storage?: boolean | null
          id?: string
          interior_sqft?: number | null
          is_featured?: boolean | null
          neighborhood?: string | null
          occupancy_date?: string | null
          original_price?: number | null
          parking_count?: number | null
          project_name?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          published_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          agent_id: string
          amount: number
          created_at: string
          currency: string | null
          id: string
          listing_id: string
          receipt_url: string | null
          status: string
          stripe_payment_id: string | null
        }
        Insert: {
          agent_id: string
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          listing_id: string
          receipt_url?: string | null
          status?: string
          stripe_payment_id?: string | null
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          listing_id?: string
          receipt_url?: string | null
          status?: string
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      agent_verification_status: "unverified" | "verified" | "rejected"
      app_role: "admin" | "moderator" | "user"
      construction_status:
        | "pre_construction"
        | "under_construction"
        | "completed"
      listing_status:
        | "draft"
        | "pending_payment"
        | "pending_approval"
        | "published"
        | "rejected"
        | "expired"
        | "paused"
      property_type: "condo" | "townhouse" | "other"
      unit_type:
        | "studio"
        | "1bed"
        | "1bed_den"
        | "2bed"
        | "2bed_den"
        | "3bed"
        | "penthouse"
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
      agent_verification_status: ["unverified", "verified", "rejected"],
      app_role: ["admin", "moderator", "user"],
      construction_status: [
        "pre_construction",
        "under_construction",
        "completed",
      ],
      listing_status: [
        "draft",
        "pending_payment",
        "pending_approval",
        "published",
        "rejected",
        "expired",
        "paused",
      ],
      property_type: ["condo", "townhouse", "other"],
      unit_type: [
        "studio",
        "1bed",
        "1bed_den",
        "2bed",
        "2bed_den",
        "3bed",
        "penthouse",
      ],
    },
  },
} as const
