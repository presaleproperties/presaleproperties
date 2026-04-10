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
      admin_tasks: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          brokerage_address?: string | null
          brokerage_name?: string
          created_at?: string
          id?: string
          license_number?: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: string
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
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      agent_waitlist: {
        Row: {
          brokerage_name: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          brokerage_name?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          brokerage_name?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
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
      automation_flows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_published: boolean
          name: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          name: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          name?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_steps: {
        Row: {
          config: Json
          created_at: string
          flow_id: string
          id: string
          is_active: boolean
          step_order: number
          step_type: Database["public"]["Enums"]["automation_step_type"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          flow_id: string
          id?: string
          is_active?: boolean
          step_order?: number
          step_type: Database["public"]["Enums"]["automation_step_type"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          flow_id?: string
          id?: string
          is_active?: boolean
          step_order?: number
          step_type?: Database["public"]["Enums"]["automation_step_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_steps_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          publish_date: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          publish_date?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          publish_date?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          buyer_type: Database["public"]["Enums"]["buyer_type"]
          cancelled_at: string | null
          city_interest: Json | null
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          intent_score: number | null
          lead_source: string | null
          name: string
          notes: string | null
          phone: string
          project_city: string | null
          project_id: string | null
          project_interest: Json | null
          project_name: string
          project_neighborhood: string | null
          project_url: string | null
          referrer: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          timeline: Database["public"]["Enums"]["buyer_timeline"]
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          buyer_type: Database["public"]["Enums"]["buyer_type"]
          cancelled_at?: string | null
          city_interest?: Json | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          intent_score?: number | null
          lead_source?: string | null
          name: string
          notes?: string | null
          phone: string
          project_city?: string | null
          project_id?: string | null
          project_interest?: Json | null
          project_name: string
          project_neighborhood?: string | null
          project_url?: string | null
          referrer?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          timeline: Database["public"]["Enums"]["buyer_timeline"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          buyer_type?: Database["public"]["Enums"]["buyer_type"]
          cancelled_at?: string | null
          city_interest?: Json | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          intent_score?: number | null
          lead_source?: string | null
          name?: string
          notes?: string | null
          phone?: string
          project_city?: string | null
          project_id?: string | null
          project_interest?: Json | null
          project_name?: string
          project_neighborhood?: string | null
          project_url?: string | null
          referrer?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          timeline?: Database["public"]["Enums"]["buyer_timeline"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presale_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_profiles: {
        Row: {
          alert_frequency: string | null
          alerts_enabled: boolean | null
          budget_max: number | null
          budget_min: number | null
          buyer_type: string | null
          created_at: string | null
          drip_sequence_step: number | null
          email: string
          full_name: string | null
          id: string
          is_vip: boolean | null
          last_alert_sent_at: string | null
          next_drip_at: string | null
          phone: string | null
          phone_verified: boolean | null
          preferred_bedrooms: number[] | null
          preferred_cities: string[] | null
          referrer: string | null
          timeline: string | null
          updated_at: string | null
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          vip_joined_at: string | null
          visitor_id: string | null
        }
        Insert: {
          alert_frequency?: string | null
          alerts_enabled?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          buyer_type?: string | null
          created_at?: string | null
          drip_sequence_step?: number | null
          email: string
          full_name?: string | null
          id?: string
          is_vip?: boolean | null
          last_alert_sent_at?: string | null
          next_drip_at?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_bedrooms?: number[] | null
          preferred_cities?: string[] | null
          referrer?: string | null
          timeline?: string | null
          updated_at?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vip_joined_at?: string | null
          visitor_id?: string | null
        }
        Update: {
          alert_frequency?: string | null
          alerts_enabled?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          buyer_type?: string | null
          created_at?: string | null
          drip_sequence_step?: number | null
          email?: string
          full_name?: string | null
          id?: string
          is_vip?: boolean | null
          last_alert_sent_at?: string | null
          next_drip_at?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_bedrooms?: number[] | null
          preferred_cities?: string[] | null
          referrer?: string | null
          timeline?: string | null
          updated_at?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vip_joined_at?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      campaign_bundles: {
        Row: {
          alt_project_1_id: string
          alt_project_2_id: string
          created_at: string
          id: string
          name: string
          primary_project_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alt_project_1_id: string
          alt_project_2_id: string
          created_at?: string
          id?: string
          name: string
          primary_project_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alt_project_1_id?: string
          alt_project_2_id?: string
          created_at?: string
          id?: string
          name?: string
          primary_project_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      campaign_templates: {
        Row: {
          brochure_url: string | null
          created_at: string
          form_data: Json
          id: string
          is_favorited: boolean | null
          last_sent_at: string | null
          name: string
          pricing_sheet_url: string | null
          project_name: string
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brochure_url?: string | null
          created_at?: string
          form_data?: Json
          id?: string
          is_favorited?: boolean | null
          last_sent_at?: string | null
          name: string
          pricing_sheet_url?: string | null
          project_name?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brochure_url?: string | null
          created_at?: string
          form_data?: Json
          id?: string
          is_favorited?: boolean | null
          last_sent_at?: string | null
          name?: string
          pricing_sheet_url?: string | null
          project_name?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      city_market_stats: {
        Row: {
          avg_price_sqft: number | null
          avg_rent_1br: number | null
          avg_rent_2br: number | null
          benchmark_price: number | null
          city: string
          created_at: string
          days_on_market: number | null
          hottest_price_band: string | null
          hottest_price_band_ratio: number | null
          id: string
          market_type: string | null
          median_sale_price: number | null
          mom_price_change: number | null
          property_type: string
          rental_source: string | null
          rental_yield: number | null
          report_month: number
          report_summary: string | null
          report_year: number
          sale_to_list_ratio: number | null
          sales_ratio: number | null
          source_board: string | null
          total_inventory: number | null
          total_sales: number | null
          updated_at: string
          yoy_price_change: number | null
        }
        Insert: {
          avg_price_sqft?: number | null
          avg_rent_1br?: number | null
          avg_rent_2br?: number | null
          benchmark_price?: number | null
          city: string
          created_at?: string
          days_on_market?: number | null
          hottest_price_band?: string | null
          hottest_price_band_ratio?: number | null
          id?: string
          market_type?: string | null
          median_sale_price?: number | null
          mom_price_change?: number | null
          property_type: string
          rental_source?: string | null
          rental_yield?: number | null
          report_month: number
          report_summary?: string | null
          report_year: number
          sale_to_list_ratio?: number | null
          sales_ratio?: number | null
          source_board?: string | null
          total_inventory?: number | null
          total_sales?: number | null
          updated_at?: string
          yoy_price_change?: number | null
        }
        Update: {
          avg_price_sqft?: number | null
          avg_rent_1br?: number | null
          avg_rent_2br?: number | null
          benchmark_price?: number | null
          city?: string
          created_at?: string
          days_on_market?: number | null
          hottest_price_band?: string | null
          hottest_price_band_ratio?: number | null
          id?: string
          market_type?: string | null
          median_sale_price?: number | null
          mom_price_change?: number | null
          property_type?: string
          rental_source?: string | null
          rental_yield?: number | null
          report_month?: number
          report_summary?: string | null
          report_year?: number
          sale_to_list_ratio?: number | null
          sales_ratio?: number | null
          source_board?: string | null
          total_inventory?: number | null
          total_sales?: number | null
          updated_at?: string
          yoy_price_change?: number | null
        }
        Relationships: []
      }
      client_activity: {
        Row: {
          activity_type: string
          city: string | null
          client_id: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          id: string
          ip_address: string | null
          listing_key: string | null
          page_title: string | null
          page_url: string | null
          price: number | null
          project_id: string | null
          project_name: string | null
          property_type: string | null
          referrer: string | null
          session_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          activity_type: string
          city?: string | null
          client_id?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          listing_key?: string | null
          page_title?: string | null
          page_url?: string | null
          price?: number | null
          project_id?: string | null
          project_name?: string | null
          property_type?: string | null
          referrer?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          activity_type?: string
          city?: string | null
          client_id?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          listing_key?: string | null
          page_title?: string | null
          page_url?: string | null
          price?: number | null
          project_id?: string | null
          project_name?: string | null
          property_type?: string | null
          referrer?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          alert_frequency: string | null
          alerts_enabled: boolean | null
          beds_max: number | null
          beds_min: number | null
          created_at: string
          drip_enabled: boolean | null
          drip_sequence: string | null
          email: string
          first_name: string | null
          id: string
          intent_score: number | null
          last_alert_sent_at: string | null
          last_drip_sent: number | null
          last_email_opened_at: string | null
          last_ip: string | null
          last_name: string | null
          last_seen_at: string | null
          next_drip_at: string | null
          notes: string | null
          persona: string | null
          phone: string | null
          preferred_cities: string[] | null
          preferred_property_types: string[] | null
          price_max: number | null
          price_min: number | null
          source: string | null
          status: string | null
          tags: string[] | null
          total_property_views: number | null
          total_site_visits: number | null
          updated_at: string
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          alert_frequency?: string | null
          alerts_enabled?: boolean | null
          beds_max?: number | null
          beds_min?: number | null
          created_at?: string
          drip_enabled?: boolean | null
          drip_sequence?: string | null
          email: string
          first_name?: string | null
          id?: string
          intent_score?: number | null
          last_alert_sent_at?: string | null
          last_drip_sent?: number | null
          last_email_opened_at?: string | null
          last_ip?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          next_drip_at?: string | null
          notes?: string | null
          persona?: string | null
          phone?: string | null
          preferred_cities?: string[] | null
          preferred_property_types?: string[] | null
          price_max?: number | null
          price_min?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          total_property_views?: number | null
          total_site_visits?: number | null
          updated_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          alert_frequency?: string | null
          alerts_enabled?: boolean | null
          beds_max?: number | null
          beds_min?: number | null
          created_at?: string
          drip_enabled?: boolean | null
          drip_sequence?: string | null
          email?: string
          first_name?: string | null
          id?: string
          intent_score?: number | null
          last_alert_sent_at?: string | null
          last_drip_sent?: number | null
          last_email_opened_at?: string | null
          last_ip?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          next_drip_at?: string | null
          notes?: string | null
          persona?: string | null
          phone?: string | null
          preferred_cities?: string[] | null
          preferred_property_types?: string[] | null
          price_max?: number | null
          price_min?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          total_property_views?: number | null
          total_site_visits?: number | null
          updated_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      cmhc_rental_data: {
        Row: {
          avg_rent_1br: number | null
          avg_rent_2br: number | null
          avg_rent_3br: number | null
          avg_rent_bachelor: number | null
          city: string
          created_at: string
          data_quality: string | null
          id: string
          rental_universe: number | null
          report_month: number | null
          report_year: number
          source_report: string | null
          source_url: string | null
          updated_at: string
          vacancy_rate_1br: number | null
          vacancy_rate_2br: number | null
          vacancy_rate_3br: number | null
          vacancy_rate_bachelor: number | null
          vacancy_rate_overall: number | null
          yoy_rent_change_1br: number | null
          yoy_rent_change_2br: number | null
          zone: string | null
        }
        Insert: {
          avg_rent_1br?: number | null
          avg_rent_2br?: number | null
          avg_rent_3br?: number | null
          avg_rent_bachelor?: number | null
          city: string
          created_at?: string
          data_quality?: string | null
          id?: string
          rental_universe?: number | null
          report_month?: number | null
          report_year: number
          source_report?: string | null
          source_url?: string | null
          updated_at?: string
          vacancy_rate_1br?: number | null
          vacancy_rate_2br?: number | null
          vacancy_rate_3br?: number | null
          vacancy_rate_bachelor?: number | null
          vacancy_rate_overall?: number | null
          yoy_rent_change_1br?: number | null
          yoy_rent_change_2br?: number | null
          zone?: string | null
        }
        Update: {
          avg_rent_1br?: number | null
          avg_rent_2br?: number | null
          avg_rent_3br?: number | null
          avg_rent_bachelor?: number | null
          city?: string
          created_at?: string
          data_quality?: string | null
          id?: string
          rental_universe?: number | null
          report_month?: number | null
          report_year?: number
          source_report?: string | null
          source_url?: string | null
          updated_at?: string
          vacancy_rate_1br?: number | null
          vacancy_rate_2br?: number | null
          vacancy_rate_3br?: number | null
          vacancy_rate_bachelor?: number | null
          vacancy_rate_overall?: number | null
          yoy_rent_change_1br?: number | null
          yoy_rent_change_2br?: number | null
          zone?: string | null
        }
        Relationships: []
      }
      crm_leads: {
        Row: {
          area_interest: string[] | null
          assigned_agent: string | null
          budget_max: number | null
          budget_min: number | null
          buyer_type: string | null
          created_at: string
          email: string | null
          id: string
          last_contacted_at: string | null
          name: string
          next_followup_at: string | null
          notes: string | null
          phone: string | null
          pipeline_status: string
          project_interest: string[] | null
          source: string | null
          tags: string[] | null
          temperature: string
          updated_at: string
        }
        Insert: {
          area_interest?: string[] | null
          assigned_agent?: string | null
          budget_max?: number | null
          budget_min?: number | null
          buyer_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name: string
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_status?: string
          project_interest?: string[] | null
          source?: string | null
          tags?: string[] | null
          temperature?: string
          updated_at?: string
        }
        Update: {
          area_interest?: string[] | null
          assigned_agent?: string | null
          budget_max?: number | null
          budget_min?: number | null
          buyer_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name?: string
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_status?: string
          project_interest?: string[] | null
          source?: string | null
          tags?: string[] | null
          temperature?: string
          updated_at?: string
        }
        Relationships: []
      }
      deck_visits: {
        Row: {
          created_at: string
          deck_id: string | null
          device_type: string | null
          id: string
          lead_email: string | null
          lead_name: string | null
          project_name: string
          referrer: string | null
          slug: string
          visit_number: number
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          deck_id?: string | null
          device_type?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          project_name: string
          referrer?: string | null
          slug: string
          visit_number?: number
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          deck_id?: string | null
          device_type?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          project_name?: string
          referrer?: string | null
          slug?: string
          visit_number?: number
          visitor_id?: string | null
        }
        Relationships: []
      }
      developer_profiles: {
        Row: {
          company_name: string
          contact_name: string
          created_at: string
          id: string
          logo_url: string | null
          phone: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          website_url: string | null
        }
        Insert: {
          company_name: string
          contact_name: string
          created_at?: string
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          website_url?: string | null
        }
        Update: {
          company_name?: string
          contact_name?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      developer_project_access: {
        Row: {
          developer_profile_id: string
          granted_at: string
          granted_by: string | null
          id: string
          project_id: string
        }
        Insert: {
          developer_profile_id: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          project_id: string
        }
        Update: {
          developer_profile_id?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_project_access_developer_profile_id_fkey"
            columns: ["developer_profile_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presale_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          cities_active: string[] | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          focus: string[] | null
          founded_year: number | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          project_count: number | null
          slug: string
          updated_at: string
          verification_status: string | null
          website_url: string | null
        }
        Insert: {
          cities_active?: string[] | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          focus?: string[] | null
          founded_year?: number | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          project_count?: number | null
          slug: string
          updated_at?: string
          verification_status?: string | null
          website_url?: string | null
        }
        Update: {
          cities_active?: string[] | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          focus?: string[] | null
          founded_year?: number | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          project_count?: number | null
          slug?: string
          updated_at?: string
          verification_status?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      email_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          meta: Json | null
          scheduled_at: string
          sent_at: string | null
          status: string
          template_id: string
          to_email: string
          to_name: string | null
          variables: Json | null
          workflow_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          meta?: Json | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template_id: string
          to_email: string
          to_name?: string | null
          variables?: Json | null
          workflow_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          meta?: Json | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template_id?: string
          to_email?: string
          to_name?: string | null
          variables?: Json | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_jobs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_jobs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "email_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          campaign_id: string | null
          email_to: string
          error_message: string | null
          id: string
          last_opened_at: string | null
          lead_id: string | null
          open_count: number
          opened_at: string | null
          recipient_name: string | null
          sent_at: string
          sent_by: string | null
          status: string
          subject: string
          template_type: string | null
          tracking_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          email_to: string
          error_message?: string | null
          id?: string
          last_opened_at?: string | null
          lead_id?: string | null
          open_count?: number
          opened_at?: string | null
          recipient_name?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject: string
          template_type?: string | null
          tracking_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          email_to?: string
          error_message?: string | null
          id?: string
          last_opened_at?: string | null
          lead_id?: string | null
          open_count?: number
          opened_at?: string | null
          recipient_name?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string
          template_type?: string | null
          tracking_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "project_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          audience_type: string | null
          created_at: string
          html_content: string
          id: string
          is_active: boolean
          name: string
          subject: string
          template_key: string | null
          template_type: string
          text_body: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          audience_type?: string | null
          created_at?: string
          html_content: string
          id?: string
          is_active?: boolean
          name: string
          subject: string
          template_key?: string | null
          template_type?: string
          text_body?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          audience_type?: string | null
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          template_key?: string | null
          template_type?: string
          text_body?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          failed_attempts: number | null
          id: string
          locked_until: string | null
          verified_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          verified_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      email_workflow_steps: {
        Row: {
          created_at: string
          delay_minutes: number
          id: string
          is_active: boolean
          send_condition: Json | null
          step_order: number
          template_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          delay_minutes?: number
          id?: string
          is_active?: boolean
          send_condition?: Json | null
          step_order?: number
          template_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          delay_minutes?: number
          id?: string
          is_active?: boolean
          send_condition?: Json | null
          step_order?: number
          template_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_workflow_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "email_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      email_workflows: {
        Row: {
          audience_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          trigger_event: string
          updated_at: string
          workflow_key: string
        }
        Insert: {
          audience_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_event: string
          updated_at?: string
          workflow_key: string
        }
        Update: {
          audience_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_event?: string
          updated_at?: string
          workflow_key?: string
        }
        Relationships: []
      }
      geocoding_logs: {
        Row: {
          api_calls_made: number | null
          batch_size: number | null
          city_filter: string | null
          completed_at: string | null
          error_message: string | null
          id: string
          listings_errors: number | null
          listings_processed: number | null
          listings_updated: number | null
          remaining_count: number | null
          started_at: string
          status: string
          trigger_source: string | null
        }
        Insert: {
          api_calls_made?: number | null
          batch_size?: number | null
          city_filter?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          listings_errors?: number | null
          listings_processed?: number | null
          listings_updated?: number | null
          remaining_count?: number | null
          started_at?: string
          status?: string
          trigger_source?: string | null
        }
        Update: {
          api_calls_made?: number | null
          batch_size?: number | null
          city_filter?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          listings_errors?: number | null
          listings_processed?: number | null
          listings_updated?: number | null
          remaining_count?: number | null
          started_at?: string
          status?: string
          trigger_source?: string | null
        }
        Relationships: []
      }
      google_reviews: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          rating: number
          review_date: string | null
          review_text: string
          reviewer_location: string | null
          reviewer_name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          rating?: number
          review_date?: string | null
          review_text: string
          reviewer_location?: string | null
          reviewer_name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          rating?: number
          review_date?: string | null
          review_text?: string
          reviewer_location?: string | null
          reviewer_name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      listings: {
        Row: {
          address: string | null
          agent_id: string | null
          assignment_price: number
          baths: number
          beds: number
          brochure_url: string | null
          buyer_agent_commission: string | null
          city: string
          created_at: string
          deposit_to_lock: number | null
          description: string | null
          developer_approval_required: boolean
          developer_name: string | null
          estimated_completion: string | null
          expires_at: string | null
          exposure: string | null
          exterior_sqft: number | null
          featured_image: string | null
          floor_level: number | null
          floor_plan_name: string | null
          floor_plan_url: string | null
          has_locker: boolean
          highlights: string[] | null
          id: string
          interior_sqft: number | null
          is_active: boolean
          is_featured: boolean
          listing_type: string
          neighborhood: string | null
          original_completion_year: number | null
          original_price: number | null
          parking: string | null
          photos: string[] | null
          project_id: string | null
          project_name: string
          published_at: string | null
          rejection_reason: string | null
          status: string
          title: string
          unit_number: string | null
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          agent_id?: string | null
          assignment_price?: number
          baths?: number
          beds?: number
          brochure_url?: string | null
          buyer_agent_commission?: string | null
          city?: string
          created_at?: string
          deposit_to_lock?: number | null
          description?: string | null
          developer_approval_required?: boolean
          developer_name?: string | null
          estimated_completion?: string | null
          expires_at?: string | null
          exposure?: string | null
          exterior_sqft?: number | null
          featured_image?: string | null
          floor_level?: number | null
          floor_plan_name?: string | null
          floor_plan_url?: string | null
          has_locker?: boolean
          highlights?: string[] | null
          id?: string
          interior_sqft?: number | null
          is_active?: boolean
          is_featured?: boolean
          listing_type?: string
          neighborhood?: string | null
          original_completion_year?: number | null
          original_price?: number | null
          parking?: string | null
          photos?: string[] | null
          project_id?: string | null
          project_name?: string
          published_at?: string | null
          rejection_reason?: string | null
          status?: string
          title?: string
          unit_number?: string | null
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          agent_id?: string | null
          assignment_price?: number
          baths?: number
          beds?: number
          brochure_url?: string | null
          buyer_agent_commission?: string | null
          city?: string
          created_at?: string
          deposit_to_lock?: number | null
          description?: string | null
          developer_approval_required?: boolean
          developer_name?: string | null
          estimated_completion?: string | null
          expires_at?: string | null
          exposure?: string | null
          exterior_sqft?: number | null
          featured_image?: string | null
          floor_level?: number | null
          floor_plan_name?: string | null
          floor_plan_url?: string | null
          has_locker?: boolean
          highlights?: string[] | null
          id?: string
          interior_sqft?: number | null
          is_active?: boolean
          is_featured?: boolean
          listing_type?: string
          neighborhood?: string | null
          original_completion_year?: number | null
          original_price?: number | null
          parking?: string | null
          photos?: string[] | null
          project_id?: string | null
          project_name?: string
          published_at?: string | null
          rejection_reason?: string | null
          status?: string
          title?: string
          unit_number?: string | null
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presale_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data: {
        Row: {
          appreciation_5yr: number
          avg_price_sqft: number
          avg_rent_1br: number
          avg_rent_2br: number
          city: string
          created_at: string
          id: string
          last_verified_date: string
          notes: string | null
          rental_yield: number
          source_name: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          appreciation_5yr?: number
          avg_price_sqft?: number
          avg_rent_1br?: number
          avg_rent_2br?: number
          city: string
          created_at?: string
          id?: string
          last_verified_date?: string
          notes?: string | null
          rental_yield?: number
          source_name?: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          appreciation_5yr?: number
          avg_price_sqft?: number
          avg_rent_1br?: number
          avg_rent_2br?: number
          city?: string
          created_at?: string
          id?: string
          last_verified_date?: string
          notes?: string | null
          rental_yield?: number
          source_name?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mls_agents: {
        Row: {
          agent_key: string
          agent_mls_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          office_key: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          agent_key: string
          agent_mls_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          office_key?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          agent_key?: string
          agent_mls_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          office_key?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mls_listings: {
        Row: {
          appliances: string[] | null
          association_fee: number | null
          association_fee_frequency: string | null
          availability_date: string | null
          bathrooms_full: number | null
          bathrooms_half: number | null
          bathrooms_total: number | null
          bedrooms_total: number | null
          buyer_agent_key: string | null
          buyer_agent_name: string | null
          buyer_office_name: string | null
          city: string
          close_date: string | null
          close_price: number | null
          community_features: string[] | null
          cooling: string[] | null
          country: string | null
          created_at: string
          cumulative_days_on_market: number | null
          days_on_market: number | null
          directions: string | null
          expiration_date: string | null
          exterior_features: string[] | null
          furnished: string | null
          garage_spaces: number | null
          heating: string[] | null
          id: string
          interior_features: string[] | null
          is_rental: boolean | null
          last_synced_at: string
          latitude: number | null
          lease_amount: number | null
          lease_frequency: string | null
          list_agent_email: string | null
          list_agent_key: string | null
          list_agent_mls_id: string | null
          list_agent_name: string | null
          list_agent_phone: string | null
          list_date: string | null
          list_office_key: string | null
          list_office_mls_id: string | null
          list_office_name: string | null
          list_office_phone: string | null
          listing_contract_date: string | null
          listing_id: string
          listing_key: string
          listing_price: number
          living_area: number | null
          living_area_units: string | null
          longitude: number | null
          lot_size_area: number | null
          lot_size_units: string | null
          mls_status: string
          modification_timestamp: string | null
          neighborhood: string | null
          open_house_date: string | null
          open_house_end_time: string | null
          open_house_remarks: string | null
          open_house_start_time: string | null
          original_list_price: number | null
          parking_total: number | null
          pets_allowed: string | null
          photos: Json | null
          photos_change_timestamp: string | null
          pool_yn: boolean | null
          postal_code: string | null
          private_remarks: string | null
          property_sub_type: string | null
          property_type: string
          public_remarks: string | null
          raw_data: Json | null
          standard_status: string | null
          state_or_province: string | null
          stories: number | null
          street_name: string | null
          street_number: string | null
          street_suffix: string | null
          subdivision_name: string | null
          sync_status: string | null
          tax_annual_amount: number | null
          tax_year: number | null
          unit_number: string | null
          unparsed_address: string | null
          updated_at: string
          utilities_included: string[] | null
          video_url: string | null
          view: string[] | null
          virtual_tour_url: string | null
          waterfront_yn: boolean | null
          year_built: number | null
        }
        Insert: {
          appliances?: string[] | null
          association_fee?: number | null
          association_fee_frequency?: string | null
          availability_date?: string | null
          bathrooms_full?: number | null
          bathrooms_half?: number | null
          bathrooms_total?: number | null
          bedrooms_total?: number | null
          buyer_agent_key?: string | null
          buyer_agent_name?: string | null
          buyer_office_name?: string | null
          city: string
          close_date?: string | null
          close_price?: number | null
          community_features?: string[] | null
          cooling?: string[] | null
          country?: string | null
          created_at?: string
          cumulative_days_on_market?: number | null
          days_on_market?: number | null
          directions?: string | null
          expiration_date?: string | null
          exterior_features?: string[] | null
          furnished?: string | null
          garage_spaces?: number | null
          heating?: string[] | null
          id?: string
          interior_features?: string[] | null
          is_rental?: boolean | null
          last_synced_at?: string
          latitude?: number | null
          lease_amount?: number | null
          lease_frequency?: string | null
          list_agent_email?: string | null
          list_agent_key?: string | null
          list_agent_mls_id?: string | null
          list_agent_name?: string | null
          list_agent_phone?: string | null
          list_date?: string | null
          list_office_key?: string | null
          list_office_mls_id?: string | null
          list_office_name?: string | null
          list_office_phone?: string | null
          listing_contract_date?: string | null
          listing_id: string
          listing_key: string
          listing_price: number
          living_area?: number | null
          living_area_units?: string | null
          longitude?: number | null
          lot_size_area?: number | null
          lot_size_units?: string | null
          mls_status?: string
          modification_timestamp?: string | null
          neighborhood?: string | null
          open_house_date?: string | null
          open_house_end_time?: string | null
          open_house_remarks?: string | null
          open_house_start_time?: string | null
          original_list_price?: number | null
          parking_total?: number | null
          pets_allowed?: string | null
          photos?: Json | null
          photos_change_timestamp?: string | null
          pool_yn?: boolean | null
          postal_code?: string | null
          private_remarks?: string | null
          property_sub_type?: string | null
          property_type: string
          public_remarks?: string | null
          raw_data?: Json | null
          standard_status?: string | null
          state_or_province?: string | null
          stories?: number | null
          street_name?: string | null
          street_number?: string | null
          street_suffix?: string | null
          subdivision_name?: string | null
          sync_status?: string | null
          tax_annual_amount?: number | null
          tax_year?: number | null
          unit_number?: string | null
          unparsed_address?: string | null
          updated_at?: string
          utilities_included?: string[] | null
          video_url?: string | null
          view?: string[] | null
          virtual_tour_url?: string | null
          waterfront_yn?: boolean | null
          year_built?: number | null
        }
        Update: {
          appliances?: string[] | null
          association_fee?: number | null
          association_fee_frequency?: string | null
          availability_date?: string | null
          bathrooms_full?: number | null
          bathrooms_half?: number | null
          bathrooms_total?: number | null
          bedrooms_total?: number | null
          buyer_agent_key?: string | null
          buyer_agent_name?: string | null
          buyer_office_name?: string | null
          city?: string
          close_date?: string | null
          close_price?: number | null
          community_features?: string[] | null
          cooling?: string[] | null
          country?: string | null
          created_at?: string
          cumulative_days_on_market?: number | null
          days_on_market?: number | null
          directions?: string | null
          expiration_date?: string | null
          exterior_features?: string[] | null
          furnished?: string | null
          garage_spaces?: number | null
          heating?: string[] | null
          id?: string
          interior_features?: string[] | null
          is_rental?: boolean | null
          last_synced_at?: string
          latitude?: number | null
          lease_amount?: number | null
          lease_frequency?: string | null
          list_agent_email?: string | null
          list_agent_key?: string | null
          list_agent_mls_id?: string | null
          list_agent_name?: string | null
          list_agent_phone?: string | null
          list_date?: string | null
          list_office_key?: string | null
          list_office_mls_id?: string | null
          list_office_name?: string | null
          list_office_phone?: string | null
          listing_contract_date?: string | null
          listing_id?: string
          listing_key?: string
          listing_price?: number
          living_area?: number | null
          living_area_units?: string | null
          longitude?: number | null
          lot_size_area?: number | null
          lot_size_units?: string | null
          mls_status?: string
          modification_timestamp?: string | null
          neighborhood?: string | null
          open_house_date?: string | null
          open_house_end_time?: string | null
          open_house_remarks?: string | null
          open_house_start_time?: string | null
          original_list_price?: number | null
          parking_total?: number | null
          pets_allowed?: string | null
          photos?: Json | null
          photos_change_timestamp?: string | null
          pool_yn?: boolean | null
          postal_code?: string | null
          private_remarks?: string | null
          property_sub_type?: string | null
          property_type?: string
          public_remarks?: string | null
          raw_data?: Json | null
          standard_status?: string | null
          state_or_province?: string | null
          stories?: number | null
          street_name?: string | null
          street_number?: string | null
          street_suffix?: string | null
          subdivision_name?: string | null
          sync_status?: string | null
          tax_annual_amount?: number | null
          tax_year?: number | null
          unit_number?: string | null
          unparsed_address?: string | null
          updated_at?: string
          utilities_included?: string[] | null
          video_url?: string | null
          view?: string[] | null
          virtual_tour_url?: string | null
          waterfront_yn?: boolean | null
          year_built?: number | null
        }
        Relationships: []
      }
      mls_offices: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          office_key: string
          office_mls_id: string | null
          office_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          office_key: string
          office_mls_id?: string | null
          office_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          office_key?: string
          office_mls_id?: string | null
          office_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mls_price_history: {
        Row: {
          id: string
          listing_key: string
          previous_price: number | null
          price: number
          recorded_at: string
        }
        Insert: {
          id?: string
          listing_key: string
          previous_price?: number | null
          price: number
          recorded_at?: string
        }
        Update: {
          id?: string
          listing_key?: string
          previous_price?: number | null
          price?: number
          recorded_at?: string
        }
        Relationships: []
      }
      mls_sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          listings_created: number | null
          listings_deleted: number | null
          listings_fetched: number | null
          listings_updated: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          listings_created?: number | null
          listings_deleted?: number | null
          listings_fetched?: number | null
          listings_updated?: number | null
          started_at?: string
          status?: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          listings_created?: number | null
          listings_deleted?: number | null
          listings_fetched?: number | null
          listings_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          landing_page: string | null
          preferred_city: string | null
          price_range: string | null
          referrer: string | null
          source: string | null
          unsubscribed_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          wants_assignments: boolean
          wants_projects: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          landing_page?: string | null
          preferred_city?: string | null
          price_range?: string | null
          referrer?: string | null
          source?: string | null
          unsubscribed_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          wants_assignments?: boolean
          wants_projects?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          landing_page?: string | null
          preferred_city?: string | null
          price_range?: string | null
          referrer?: string | null
          source?: string | null
          unsubscribed_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          wants_assignments?: boolean
          wants_projects?: boolean
        }
        Relationships: []
      }
      notifications_queue: {
        Row: {
          body: string
          created_at: string | null
          id: string
          metadata: Json | null
          notification_type: string
          recipient_email: string
          recipient_type: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          recipient_email: string
          recipient_type: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          recipient_email?: string
          recipient_type?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      off_market_access: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_range: string | null
          created_at: string | null
          email: string
          first_name: string
          has_agent: boolean | null
          id: string
          last_name: string
          lead_id: string | null
          listing_id: string | null
          message: string | null
          phone: string
          source: string | null
          status: string | null
          timeline: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_range?: string | null
          created_at?: string | null
          email: string
          first_name: string
          has_agent?: boolean | null
          id?: string
          last_name: string
          lead_id?: string | null
          listing_id?: string | null
          message?: string | null
          phone: string
          source?: string | null
          status?: string | null
          timeline?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_range?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          has_agent?: boolean | null
          id?: string
          last_name?: string
          lead_id?: string | null
          listing_id?: string | null
          message?: string | null
          phone?: string
          source?: string | null
          status?: string | null
          timeline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "off_market_access_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "off_market_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      off_market_analytics: {
        Row: {
          created_at: string | null
          device: string | null
          event_type: string
          id: string
          listing_id: string | null
          referrer: string | null
          unit_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          device?: string | null
          event_type: string
          id?: string
          listing_id?: string | null
          referrer?: string | null
          unit_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          device?: string | null
          event_type?: string
          id?: string
          listing_id?: string | null
          referrer?: string | null
          unit_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "off_market_analytics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "off_market_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "off_market_analytics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "off_market_units"
            referencedColumns: ["id"]
          },
        ]
      }
      off_market_batches: {
        Row: {
          ac_included: boolean | null
          admin_notes: string | null
          created_at: string
          deposit_structure: string | null
          id: string
          incentives: string | null
          is_active: boolean | null
          parking_included: boolean | null
          project_id: string
          updated_at: string
        }
        Insert: {
          ac_included?: boolean | null
          admin_notes?: string | null
          created_at?: string
          deposit_structure?: string | null
          id?: string
          incentives?: string | null
          is_active?: boolean | null
          parking_included?: boolean | null
          project_id: string
          updated_at?: string
        }
        Update: {
          ac_included?: boolean | null
          admin_notes?: string | null
          created_at?: string
          deposit_structure?: string | null
          id?: string
          incentives?: string | null
          is_active?: boolean | null
          parking_included?: boolean | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "off_market_batches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presale_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      off_market_inquiries: {
        Row: {
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          created_at: string
          id: string
          listing_id: string
          message: string | null
          project_name: string | null
          status: string
          unit_id: string | null
          unit_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          project_name?: string | null
          status?: string
          unit_id?: string | null
          unit_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          project_name?: string | null
          status?: string
          unit_id?: string | null
          unit_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "off_market_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "off_market_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "off_market_inquiries_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "off_market_units"
            referencedColumns: ["id"]
          },
        ]
      }
      off_market_listings: {
        Row: {
          access_level: string | null
          additional_notes: string | null
          assignment_allowed: boolean | null
          assignment_fee: string | null
          auto_approve_access: boolean | null
          available_units: number | null
          available_upgrades: Json | null
          brochure_url: string | null
          completion_date: string | null
          construction_stage: string | null
          created_at: string | null
          deposit_percentage: number | null
          deposit_structure: string | null
          developer_id: string | null
          developer_name: string | null
          floorplan_urls: string[] | null
          id: string
          incentive_expiry: string | null
          incentives: string | null
          info_sheet_url: string | null
          linked_project_name: string
          linked_project_slug: string
          locker_cost: number | null
          locker_included: boolean | null
          parking_cost: number | null
          parking_included: boolean | null
          parking_type: string | null
          photo_urls: string[] | null
          pricing_sheet_url: string | null
          published_at: string | null
          status: string | null
          storage_cost: number | null
          storage_included: boolean | null
          storage_size: string | null
          total_units: number | null
          unlock_request_count: number | null
          updated_at: string | null
          view_count: number | null
          vip_incentives: string | null
        }
        Insert: {
          access_level?: string | null
          additional_notes?: string | null
          assignment_allowed?: boolean | null
          assignment_fee?: string | null
          auto_approve_access?: boolean | null
          available_units?: number | null
          available_upgrades?: Json | null
          brochure_url?: string | null
          completion_date?: string | null
          construction_stage?: string | null
          created_at?: string | null
          deposit_percentage?: number | null
          deposit_structure?: string | null
          developer_id?: string | null
          developer_name?: string | null
          floorplan_urls?: string[] | null
          id?: string
          incentive_expiry?: string | null
          incentives?: string | null
          info_sheet_url?: string | null
          linked_project_name: string
          linked_project_slug: string
          locker_cost?: number | null
          locker_included?: boolean | null
          parking_cost?: number | null
          parking_included?: boolean | null
          parking_type?: string | null
          photo_urls?: string[] | null
          pricing_sheet_url?: string | null
          published_at?: string | null
          status?: string | null
          storage_cost?: number | null
          storage_included?: boolean | null
          storage_size?: string | null
          total_units?: number | null
          unlock_request_count?: number | null
          updated_at?: string | null
          view_count?: number | null
          vip_incentives?: string | null
        }
        Update: {
          access_level?: string | null
          additional_notes?: string | null
          assignment_allowed?: boolean | null
          assignment_fee?: string | null
          auto_approve_access?: boolean | null
          available_units?: number | null
          available_upgrades?: Json | null
          brochure_url?: string | null
          completion_date?: string | null
          construction_stage?: string | null
          created_at?: string | null
          deposit_percentage?: number | null
          deposit_structure?: string | null
          developer_id?: string | null
          developer_name?: string | null
          floorplan_urls?: string[] | null
          id?: string
          incentive_expiry?: string | null
          incentives?: string | null
          info_sheet_url?: string | null
          linked_project_name?: string
          linked_project_slug?: string
          locker_cost?: number | null
          locker_included?: boolean | null
          parking_cost?: number | null
          parking_included?: boolean | null
          parking_type?: string | null
          photo_urls?: string[] | null
          pricing_sheet_url?: string | null
          published_at?: string | null
          status?: string | null
          storage_cost?: number | null
          storage_included?: boolean | null
          storage_size?: string | null
          total_units?: number | null
          unlock_request_count?: number | null
          updated_at?: string | null
          view_count?: number | null
          vip_incentives?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "off_market_listings_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      off_market_units: {
        Row: {
          available_upgrades: Json | null
          bathrooms: number
          bedrooms: number
          created_at: string | null
          developer_id: string | null
          display_order: number | null
          floor_level: number | null
          floorplan_thumbnail_url: string | null
          floorplan_url: string | null
          has_unit_incentive: boolean | null
          id: string
          inclusions: string[] | null
          listing_id: string | null
          locker_included: boolean | null
          orientation: string | null
          parking_included: boolean | null
          parking_type: string | null
          photo_urls: string[] | null
          price: number
          price_per_sqft: number | null
          reserved_at: string | null
          sold_at: string | null
          sqft: number
          status: string | null
          storage_included: boolean | null
          storage_type: string | null
          unit_incentive: string | null
          unit_name: string | null
          unit_number: string
          unit_type: string | null
          updated_at: string | null
          view_type: string | null
        }
        Insert: {
          available_upgrades?: Json | null
          bathrooms: number
          bedrooms: number
          created_at?: string | null
          developer_id?: string | null
          display_order?: number | null
          floor_level?: number | null
          floorplan_thumbnail_url?: string | null
          floorplan_url?: string | null
          has_unit_incentive?: boolean | null
          id?: string
          inclusions?: string[] | null
          listing_id?: string | null
          locker_included?: boolean | null
          orientation?: string | null
          parking_included?: boolean | null
          parking_type?: string | null
          photo_urls?: string[] | null
          price: number
          price_per_sqft?: number | null
          reserved_at?: string | null
          sold_at?: string | null
          sqft: number
          status?: string | null
          storage_included?: boolean | null
          storage_type?: string | null
          unit_incentive?: string | null
          unit_name?: string | null
          unit_number: string
          unit_type?: string | null
          updated_at?: string | null
          view_type?: string | null
        }
        Update: {
          available_upgrades?: Json | null
          bathrooms?: number
          bedrooms?: number
          created_at?: string | null
          developer_id?: string | null
          display_order?: number | null
          floor_level?: number | null
          floorplan_thumbnail_url?: string | null
          floorplan_url?: string | null
          has_unit_incentive?: boolean | null
          id?: string
          inclusions?: string[] | null
          listing_id?: string | null
          locker_included?: boolean | null
          orientation?: string | null
          parking_included?: boolean | null
          parking_type?: string | null
          photo_urls?: string[] | null
          price?: number
          price_per_sqft?: number | null
          reserved_at?: string | null
          sold_at?: string | null
          sqft?: number
          status?: string | null
          storage_included?: boolean | null
          storage_type?: string | null
          unit_incentive?: string | null
          unit_name?: string | null
          unit_number?: string
          unit_type?: string | null
          updated_at?: string | null
          view_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "off_market_units_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "off_market_units_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "off_market_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarded_leads: {
        Row: {
          created_at: string
          deck_id: string | null
          deck_url: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          source: string
          tags: string[]
          temperature: string
          template_id: string | null
          updated_at: string
          user_id: string
          zapier_synced: boolean
        }
        Insert: {
          created_at?: string
          deck_id?: string | null
          deck_url?: string | null
          email: string
          first_name: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          source?: string
          tags?: string[]
          temperature?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
          zapier_synced?: boolean
        }
        Update: {
          created_at?: string
          deck_id?: string | null
          deck_url?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          source?: string
          tags?: string[]
          temperature?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
          zapier_synced?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "onboarded_leads_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "pitch_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarded_leads_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_decks: {
        Row: {
          address: string | null
          amenities: string[] | null
          assignment_fee: string | null
          city: string | null
          completion_year: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          deposit_steps: Json | null
          description: string | null
          developer_name: string | null
          floor_plans: Json
          floor_plans_pdf_url: string | null
          gallery: Json
          gate_enabled: boolean
          gated_sections: string[]
          hero_image_url: string | null
          highlights: string[] | null
          id: string
          included_items: string[] | null
          is_published: boolean
          lat: number | null
          latitude: number | null
          linked_project_id: string | null
          lng: number | null
          longitude: number | null
          next_price_increase: string | null
          project_name: string
          projections: Json
          proximity_highlights: Json
          slug: string
          stories: number | null
          tagline: string | null
          total_units: number | null
          units_remaining: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          assignment_fee?: string | null
          city?: string | null
          completion_year?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          deposit_steps?: Json | null
          description?: string | null
          developer_name?: string | null
          floor_plans?: Json
          floor_plans_pdf_url?: string | null
          gallery?: Json
          gate_enabled?: boolean
          gated_sections?: string[]
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          included_items?: string[] | null
          is_published?: boolean
          lat?: number | null
          latitude?: number | null
          linked_project_id?: string | null
          lng?: number | null
          longitude?: number | null
          next_price_increase?: string | null
          project_name?: string
          projections?: Json
          proximity_highlights?: Json
          slug: string
          stories?: number | null
          tagline?: string | null
          total_units?: number | null
          units_remaining?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          assignment_fee?: string | null
          city?: string | null
          completion_year?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          deposit_steps?: Json | null
          description?: string | null
          developer_name?: string | null
          floor_plans?: Json
          floor_plans_pdf_url?: string | null
          gallery?: Json
          gate_enabled?: boolean
          gated_sections?: string[]
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          included_items?: string[] | null
          is_published?: boolean
          lat?: number | null
          latitude?: number | null
          linked_project_id?: string | null
          lng?: number | null
          longitude?: number | null
          next_price_increase?: string | null
          project_name?: string
          projections?: Json
          proximity_highlights?: Json
          slug?: string
          stories?: number | null
          tagline?: string | null
          total_units?: number | null
          units_remaining?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      presale_projects: {
        Row: {
          address: string | null
          amenities: string[] | null
          assignment_allowed: string | null
          assignment_fees: string | null
          brochure_files: string[] | null
          city: string
          completion_month: number | null
          completion_year: number | null
          created_at: string
          deposit_percent: number | null
          deposit_structure: string | null
          developer_id: string | null
          developer_name: string | null
          faq: Json | null
          featured_image: string | null
          floorplan_files: string[] | null
          full_description: string | null
          gallery_images: string[] | null
          highlights: string[] | null
          id: string
          incentives: string | null
          incentives_available: boolean | null
          info_source: string | null
          is_featured: boolean
          is_indexed: boolean
          is_published: boolean
          last_verified_date: string | null
          map_lat: number | null
          map_lng: number | null
          name: string
          near_skytrain: boolean | null
          neighborhood: string
          occupancy_estimate: string | null
          og_image: string | null
          price_range: string | null
          pricing_sheets: string[] | null
          project_type: Database["public"]["Enums"]["project_type"]
          published_at: string | null
          rental_restrictions: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          show_in_hero: boolean
          slug: string
          starting_price: number | null
          status: Database["public"]["Enums"]["project_status"]
          strata_fees: string | null
          unit_mix: string | null
          updated_at: string
          video_url: string | null
          view_count: number
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          assignment_allowed?: string | null
          assignment_fees?: string | null
          brochure_files?: string[] | null
          city: string
          completion_month?: number | null
          completion_year?: number | null
          created_at?: string
          deposit_percent?: number | null
          deposit_structure?: string | null
          developer_id?: string | null
          developer_name?: string | null
          faq?: Json | null
          featured_image?: string | null
          floorplan_files?: string[] | null
          full_description?: string | null
          gallery_images?: string[] | null
          highlights?: string[] | null
          id?: string
          incentives?: string | null
          incentives_available?: boolean | null
          info_source?: string | null
          is_featured?: boolean
          is_indexed?: boolean
          is_published?: boolean
          last_verified_date?: string | null
          map_lat?: number | null
          map_lng?: number | null
          name: string
          near_skytrain?: boolean | null
          neighborhood: string
          occupancy_estimate?: string | null
          og_image?: string | null
          price_range?: string | null
          pricing_sheets?: string[] | null
          project_type?: Database["public"]["Enums"]["project_type"]
          published_at?: string | null
          rental_restrictions?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          show_in_hero?: boolean
          slug: string
          starting_price?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          strata_fees?: string | null
          unit_mix?: string | null
          updated_at?: string
          video_url?: string | null
          view_count?: number
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          assignment_allowed?: string | null
          assignment_fees?: string | null
          brochure_files?: string[] | null
          city?: string
          completion_month?: number | null
          completion_year?: number | null
          created_at?: string
          deposit_percent?: number | null
          deposit_structure?: string | null
          developer_id?: string | null
          developer_name?: string | null
          faq?: Json | null
          featured_image?: string | null
          floorplan_files?: string[] | null
          full_description?: string | null
          gallery_images?: string[] | null
          highlights?: string[] | null
          id?: string
          incentives?: string | null
          incentives_available?: boolean | null
          info_source?: string | null
          is_featured?: boolean
          is_indexed?: boolean
          is_published?: boolean
          last_verified_date?: string | null
          map_lat?: number | null
          map_lng?: number | null
          name?: string
          near_skytrain?: boolean | null
          neighborhood?: string
          occupancy_estimate?: string | null
          og_image?: string | null
          price_range?: string | null
          pricing_sheets?: string[] | null
          project_type?: Database["public"]["Enums"]["project_type"]
          published_at?: string | null
          rental_restrictions?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          show_in_hero?: boolean
          slug?: string
          starting_price?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          strata_fees?: string | null
          unit_mix?: string | null
          updated_at?: string
          video_url?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "presale_projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
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
      project_leads: {
        Row: {
          admin_notes: string | null
          agent_status: string | null
          budget: string | null
          city_interest: Json | null
          contacted_at: string | null
          converted_at: string | null
          created_at: string
          device_type: string | null
          drip_sequence: string | null
          email: string
          form_type: string | null
          home_size: string | null
          id: string
          intent_score: number | null
          landing_page: string | null
          last_drip_sent: number | null
          lead_score: number | null
          lead_source: string | null
          lead_sources: string[]
          lead_status: string
          lead_temperature: string | null
          lofty_id: string | null
          lofty_synced_at: string | null
          message: string | null
          name: string
          next_drip_at: string | null
          pages_viewed: number | null
          persona: string | null
          phone: string | null
          project_id: string | null
          project_interest: Json | null
          referrer: string | null
          session_count: number | null
          session_id: string | null
          time_on_site: number | null
          timeline: string | null
          tracking_data: Json | null
          used_calculator: boolean | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          agent_status?: string | null
          budget?: string | null
          city_interest?: Json | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          device_type?: string | null
          drip_sequence?: string | null
          email: string
          form_type?: string | null
          home_size?: string | null
          id?: string
          intent_score?: number | null
          landing_page?: string | null
          last_drip_sent?: number | null
          lead_score?: number | null
          lead_source?: string | null
          lead_sources?: string[]
          lead_status?: string
          lead_temperature?: string | null
          lofty_id?: string | null
          lofty_synced_at?: string | null
          message?: string | null
          name: string
          next_drip_at?: string | null
          pages_viewed?: number | null
          persona?: string | null
          phone?: string | null
          project_id?: string | null
          project_interest?: Json | null
          referrer?: string | null
          session_count?: number | null
          session_id?: string | null
          time_on_site?: number | null
          timeline?: string | null
          tracking_data?: Json | null
          used_calculator?: boolean | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          agent_status?: string | null
          budget?: string | null
          city_interest?: Json | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          device_type?: string | null
          drip_sequence?: string | null
          email?: string
          form_type?: string | null
          home_size?: string | null
          id?: string
          intent_score?: number | null
          landing_page?: string | null
          last_drip_sent?: number | null
          lead_score?: number | null
          lead_source?: string | null
          lead_sources?: string[]
          lead_status?: string
          lead_temperature?: string | null
          lofty_id?: string | null
          lofty_synced_at?: string | null
          message?: string | null
          name?: string
          next_drip_at?: string | null
          pages_viewed?: number | null
          persona?: string | null
          phone?: string | null
          project_id?: string | null
          project_interest?: Json | null
          referrer?: string | null
          session_count?: number | null
          session_id?: string | null
          time_on_site?: number | null
          timeline?: string | null
          tracking_data?: Json | null
          used_calculator?: boolean | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presale_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      property_alerts: {
        Row: {
          alert_type: string
          clicked_at: string | null
          client_id: string
          created_at: string
          id: string
          listing_key: string | null
          opened_at: string | null
          previous_price: number | null
          price: number | null
          project_id: string | null
          property_address: string | null
          property_name: string | null
          saved_search_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          alert_type: string
          clicked_at?: string | null
          client_id: string
          created_at?: string
          id?: string
          listing_key?: string | null
          opened_at?: string | null
          previous_price?: number | null
          price?: number | null
          project_id?: string | null
          property_address?: string | null
          property_name?: string | null
          saved_search_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          alert_type?: string
          clicked_at?: string | null
          client_id?: string
          created_at?: string
          id?: string
          listing_key?: string | null
          opened_at?: string | null
          previous_price?: number | null
          price?: number | null
          project_id?: string | null
          property_address?: string | null
          property_name?: string | null
          saved_search_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_alerts_saved_search_id_fkey"
            columns: ["saved_search_id"]
            isOneToOne: false
            referencedRelation: "saved_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          created_at: string
          id: number
          rate_key: string
        }
        Insert: {
          created_at?: string
          id?: number
          rate_key: string
        }
        Update: {
          created_at?: string
          id?: number
          rate_key?: string
        }
        Relationships: []
      }
      saved_listings: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_projects: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          notes: string | null
          project_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_projects_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presale_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alert_frequency: string | null
          baths_min: number | null
          beds_max: number | null
          beds_min: number | null
          cities: string[] | null
          client_id: string
          created_at: string
          id: string
          is_active: boolean | null
          last_alert_at: string | null
          last_matched_listings: string[] | null
          listing_types: string[] | null
          name: string
          neighborhoods: string[] | null
          price_max: number | null
          price_min: number | null
          property_types: string[] | null
          sqft_max: number | null
          sqft_min: number | null
          updated_at: string
          year_built_min: number | null
        }
        Insert: {
          alert_frequency?: string | null
          baths_min?: number | null
          beds_max?: number | null
          beds_min?: number | null
          cities?: string[] | null
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_alert_at?: string | null
          last_matched_listings?: string[] | null
          listing_types?: string[] | null
          name?: string
          neighborhoods?: string[] | null
          price_max?: number | null
          price_min?: number | null
          property_types?: string[] | null
          sqft_max?: number | null
          sqft_min?: number | null
          updated_at?: string
          year_built_min?: number | null
        }
        Update: {
          alert_frequency?: string | null
          baths_min?: number | null
          beds_max?: number | null
          beds_min?: number | null
          cities?: string[] | null
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_alert_at?: string | null
          last_matched_listings?: string[] | null
          listing_types?: string[] | null
          name?: string
          neighborhoods?: string[] | null
          price_max?: number | null
          price_min?: number | null
          property_types?: string[] | null
          sqft_max?: number | null
          sqft_min?: number | null
          updated_at?: string
          year_built_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduler_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      scheduler_blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      scheduler_settings: {
        Row: {
          advance_booking_days: number
          buffer_minutes: number
          id: string
          max_bookings_per_slot: number
          slot_duration_minutes: number
          updated_at: string
        }
        Insert: {
          advance_booking_days?: number
          buffer_minutes?: number
          id?: string
          max_bookings_per_slot?: number
          slot_duration_minutes?: number
          updated_at?: string
        }
        Update: {
          advance_booking_days?: number
          buffer_minutes?: number
          id?: string
          max_bookings_per_slot?: number
          slot_duration_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      seo_health_checks: {
        Row: {
          canonical_issues: Json | null
          check_type: string
          city_pages_status: Json | null
          completed_at: string | null
          created_at: string
          id: string
          issues: Json | null
          non_indexed_analysis: Json | null
          sitemap_breakdown: Json | null
          sitemap_url_count: number | null
          started_at: string
          status: string
          summary: string | null
          warnings: Json | null
        }
        Insert: {
          canonical_issues?: Json | null
          check_type: string
          city_pages_status?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          issues?: Json | null
          non_indexed_analysis?: Json | null
          sitemap_breakdown?: Json | null
          sitemap_url_count?: number | null
          started_at?: string
          status?: string
          summary?: string | null
          warnings?: Json | null
        }
        Update: {
          canonical_issues?: Json | null
          check_type?: string
          city_pages_status?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          issues?: Json | null
          non_indexed_analysis?: Json | null
          sitemap_breakdown?: Json | null
          sitemap_url_count?: number | null
          started_at?: string
          status?: string
          summary?: string | null
          warnings?: Json | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          instagram_url: string | null
          is_active: boolean | null
          linkedin_url: string | null
          phone: string | null
          photo_url: string | null
          sort_order: number | null
          specializations: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          phone?: string | null
          photo_url?: string | null
          sort_order?: number | null
          specializations?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          phone?: string | null
          photo_url?: string | null
          sort_order?: number | null
          specializations?: string[] | null
          title?: string
          updated_at?: string
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
      vip_registrations: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          interest: string | null
          landing_page: string | null
          phone: string | null
          source: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          interest?: string | null
          landing_page?: string | null
          phone?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          interest?: string | null
          landing_page?: string | null
          phone?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      mls_agents_public: {
        Row: {
          agent_key: string | null
          first_name: string | null
          full_name: string | null
          last_name: string | null
          office_key: string | null
        }
        Insert: {
          agent_key?: string | null
          first_name?: string | null
          full_name?: string | null
          last_name?: string | null
          office_key?: string | null
        }
        Update: {
          agent_key?: string | null
          first_name?: string | null
          full_name?: string | null
          last_name?: string | null
          office_key?: string | null
        }
        Relationships: []
      }
      mls_listings_safe: {
        Row: {
          appliances: string[] | null
          association_fee: number | null
          association_fee_frequency: string | null
          availability_date: string | null
          bathrooms_full: number | null
          bathrooms_half: number | null
          bathrooms_total: number | null
          bedrooms_total: number | null
          buyer_agent_key: string | null
          buyer_agent_name: string | null
          buyer_office_name: string | null
          city: string | null
          close_date: string | null
          close_price: number | null
          community_features: string[] | null
          cooling: string[] | null
          country: string | null
          created_at: string | null
          cumulative_days_on_market: number | null
          days_on_market: number | null
          directions: string | null
          expiration_date: string | null
          exterior_features: string[] | null
          furnished: string | null
          garage_spaces: number | null
          heating: string[] | null
          id: string | null
          interior_features: string[] | null
          is_rental: boolean | null
          last_synced_at: string | null
          latitude: number | null
          lease_amount: number | null
          lease_frequency: string | null
          list_agent_email: string | null
          list_agent_key: string | null
          list_agent_mls_id: string | null
          list_agent_name: string | null
          list_agent_phone: string | null
          list_date: string | null
          list_office_key: string | null
          list_office_mls_id: string | null
          list_office_name: string | null
          list_office_phone: string | null
          listing_contract_date: string | null
          listing_id: string | null
          listing_key: string | null
          listing_price: number | null
          living_area: number | null
          living_area_units: string | null
          longitude: number | null
          lot_size_area: number | null
          lot_size_units: string | null
          mls_status: string | null
          modification_timestamp: string | null
          neighborhood: string | null
          open_house_date: string | null
          open_house_end_time: string | null
          open_house_remarks: string | null
          open_house_start_time: string | null
          original_list_price: number | null
          parking_total: number | null
          pets_allowed: string | null
          photos: Json | null
          photos_change_timestamp: string | null
          pool_yn: boolean | null
          postal_code: string | null
          property_sub_type: string | null
          property_type: string | null
          public_remarks: string | null
          standard_status: string | null
          state_or_province: string | null
          stories: number | null
          street_name: string | null
          street_number: string | null
          street_suffix: string | null
          subdivision_name: string | null
          sync_status: string | null
          tax_annual_amount: number | null
          tax_year: number | null
          unit_number: string | null
          unparsed_address: string | null
          updated_at: string | null
          utilities_included: string[] | null
          video_url: string | null
          view: string[] | null
          virtual_tour_url: string | null
          waterfront_yn: boolean | null
          year_built: number | null
        }
        Insert: {
          appliances?: string[] | null
          association_fee?: number | null
          association_fee_frequency?: string | null
          availability_date?: string | null
          bathrooms_full?: number | null
          bathrooms_half?: number | null
          bathrooms_total?: number | null
          bedrooms_total?: number | null
          buyer_agent_key?: string | null
          buyer_agent_name?: string | null
          buyer_office_name?: string | null
          city?: string | null
          close_date?: string | null
          close_price?: number | null
          community_features?: string[] | null
          cooling?: string[] | null
          country?: string | null
          created_at?: string | null
          cumulative_days_on_market?: number | null
          days_on_market?: number | null
          directions?: string | null
          expiration_date?: string | null
          exterior_features?: string[] | null
          furnished?: string | null
          garage_spaces?: number | null
          heating?: string[] | null
          id?: string | null
          interior_features?: string[] | null
          is_rental?: boolean | null
          last_synced_at?: string | null
          latitude?: number | null
          lease_amount?: number | null
          lease_frequency?: string | null
          list_agent_email?: string | null
          list_agent_key?: string | null
          list_agent_mls_id?: string | null
          list_agent_name?: string | null
          list_agent_phone?: string | null
          list_date?: string | null
          list_office_key?: string | null
          list_office_mls_id?: string | null
          list_office_name?: string | null
          list_office_phone?: string | null
          listing_contract_date?: string | null
          listing_id?: string | null
          listing_key?: string | null
          listing_price?: number | null
          living_area?: number | null
          living_area_units?: string | null
          longitude?: number | null
          lot_size_area?: number | null
          lot_size_units?: string | null
          mls_status?: string | null
          modification_timestamp?: string | null
          neighborhood?: string | null
          open_house_date?: string | null
          open_house_end_time?: string | null
          open_house_remarks?: string | null
          open_house_start_time?: string | null
          original_list_price?: number | null
          parking_total?: number | null
          pets_allowed?: string | null
          photos?: Json | null
          photos_change_timestamp?: string | null
          pool_yn?: boolean | null
          postal_code?: string | null
          property_sub_type?: string | null
          property_type?: string | null
          public_remarks?: string | null
          standard_status?: string | null
          state_or_province?: string | null
          stories?: number | null
          street_name?: string | null
          street_number?: string | null
          street_suffix?: string | null
          subdivision_name?: string | null
          sync_status?: string | null
          tax_annual_amount?: number | null
          tax_year?: number | null
          unit_number?: string | null
          unparsed_address?: string | null
          updated_at?: string | null
          utilities_included?: string[] | null
          video_url?: string | null
          view?: string[] | null
          virtual_tour_url?: string | null
          waterfront_yn?: boolean | null
          year_built?: number | null
        }
        Update: {
          appliances?: string[] | null
          association_fee?: number | null
          association_fee_frequency?: string | null
          availability_date?: string | null
          bathrooms_full?: number | null
          bathrooms_half?: number | null
          bathrooms_total?: number | null
          bedrooms_total?: number | null
          buyer_agent_key?: string | null
          buyer_agent_name?: string | null
          buyer_office_name?: string | null
          city?: string | null
          close_date?: string | null
          close_price?: number | null
          community_features?: string[] | null
          cooling?: string[] | null
          country?: string | null
          created_at?: string | null
          cumulative_days_on_market?: number | null
          days_on_market?: number | null
          directions?: string | null
          expiration_date?: string | null
          exterior_features?: string[] | null
          furnished?: string | null
          garage_spaces?: number | null
          heating?: string[] | null
          id?: string | null
          interior_features?: string[] | null
          is_rental?: boolean | null
          last_synced_at?: string | null
          latitude?: number | null
          lease_amount?: number | null
          lease_frequency?: string | null
          list_agent_email?: string | null
          list_agent_key?: string | null
          list_agent_mls_id?: string | null
          list_agent_name?: string | null
          list_agent_phone?: string | null
          list_date?: string | null
          list_office_key?: string | null
          list_office_mls_id?: string | null
          list_office_name?: string | null
          list_office_phone?: string | null
          listing_contract_date?: string | null
          listing_id?: string | null
          listing_key?: string | null
          listing_price?: number | null
          living_area?: number | null
          living_area_units?: string | null
          longitude?: number | null
          lot_size_area?: number | null
          lot_size_units?: string | null
          mls_status?: string | null
          modification_timestamp?: string | null
          neighborhood?: string | null
          open_house_date?: string | null
          open_house_end_time?: string | null
          open_house_remarks?: string | null
          open_house_start_time?: string | null
          original_list_price?: number | null
          parking_total?: number | null
          pets_allowed?: string | null
          photos?: Json | null
          photos_change_timestamp?: string | null
          pool_yn?: boolean | null
          postal_code?: string | null
          property_sub_type?: string | null
          property_type?: string | null
          public_remarks?: string | null
          standard_status?: string | null
          state_or_province?: string | null
          stories?: number | null
          street_name?: string | null
          street_number?: string | null
          street_suffix?: string | null
          subdivision_name?: string | null
          sync_status?: string | null
          tax_annual_amount?: number | null
          tax_year?: number | null
          unit_number?: string | null
          unparsed_address?: string | null
          updated_at?: string | null
          utilities_included?: string[] | null
          video_url?: string | null
          view?: string[] | null
          virtual_tour_url?: string | null
          waterfront_yn?: boolean | null
          year_built?: number | null
        }
        Relationships: []
      }
      mls_offices_public: {
        Row: {
          city: string | null
          created_at: string | null
          id: string | null
          office_key: string | null
          office_mls_id: string | null
          office_name: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string | null
          office_key?: string | null
          office_mls_id?: string | null
          office_name?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string | null
          office_key?: string | null
          office_mls_id?: string | null
          office_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_members_public: {
        Row: {
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          instagram_url: string | null
          is_active: boolean | null
          linkedin_url: string | null
          photo_url: string | null
          sort_order: number | null
          specializations: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          photo_url?: string | null
          sort_order?: number | null
          specializations?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          photo_url?: string | null
          sort_order?: number | null
          specializations?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_rate_limit_log: { Args: never; Returns: undefined }
      get_engagement_funnel: {
        Args: { days_back?: number }
        Returns: {
          total_cta_clicks: number
          total_floorplan_views: number
          total_form_starts: number
          total_form_submits: number
          total_page_views: number
          total_property_views: number
          unique_page_viewers: number
          unique_property_viewers: number
        }[]
      }
      get_map_pins: {
        Args: {
          p_cities?: string[]
          p_lat_max?: number
          p_lat_min?: number
          p_limit?: number
          p_listed_after?: string
          p_lng_max?: number
          p_lng_min?: number
          p_max_price?: number
          p_max_sqft?: number
          p_min_baths?: number
          p_min_beds?: number
          p_min_price?: number
          p_min_sqft?: number
          p_min_year?: number
        }
        Returns: {
          bathrooms_total: number
          bedrooms_total: number
          city: string
          first_photo_url: string
          id: string
          latitude: number
          list_agent_name: string
          list_date: string
          list_office_name: string
          listing_key: string
          listing_price: number
          living_area: number
          longitude: number
          neighborhood: string
          property_sub_type: string
          property_type: string
          street_name: string
          street_number: string
          street_suffix: string
          year_built: number
        }[]
      }
      get_public_team_members: {
        Args: never
        Returns: {
          bio: string
          full_name: string
          id: string
          instagram_url: string
          linkedin_url: string
          photo_url: string
          specializations: string[]
          title: string
        }[]
      }
      get_top_mls_listings_with_engagement: {
        Args: { days_back?: number; result_limit?: number }
        Returns: {
          bathrooms_total: number
          bedrooms_total: number
          city: string
          cta_clicks: number
          form_starts: number
          listing_id: string
          listing_key: string
          listing_price: number
          property_address: string
          total_views: number
          unique_viewers: number
        }[]
      }
      get_top_projects_with_engagement: {
        Args: { days_back?: number; result_limit?: number }
        Returns: {
          cta_clicks: number
          floorplan_views: number
          form_starts: number
          form_submits: number
          project_city: string
          project_id: string
          project_name: string
          total_views: number
          unique_visitors: number
        }[]
      }
      get_top_viewed_projects: {
        Args: { days_back?: number; result_limit?: number }
        Returns: {
          project_city: string
          project_id: string
          project_name: string
          total_views: number
          unique_visitors: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_project_view: {
        Args: { project_id: string }
        Returns: undefined
      }
      update_listing_agent_names: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "developer" | "agent"
      appointment_type: "preview" | "showing"
      automation_step_type:
        | "delay"
        | "send_email"
        | "send_sms"
        | "send_whatsapp"
        | "condition"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      buyer_timeline:
        | "0_3_months"
        | "3_6_months"
        | "6_12_months"
        | "12_plus_months"
      buyer_type: "first_time" | "investor" | "upgrader" | "other"
      project_status: "coming_soon" | "registering" | "active" | "sold_out"
      project_type: "condo" | "townhome" | "mixed" | "duplex" | "single_family"
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
      app_role: ["admin", "moderator", "user", "developer", "agent"],
      appointment_type: ["preview", "showing"],
      automation_step_type: [
        "delay",
        "send_email",
        "send_sms",
        "send_whatsapp",
        "condition",
      ],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      buyer_timeline: [
        "0_3_months",
        "3_6_months",
        "6_12_months",
        "12_plus_months",
      ],
      buyer_type: ["first_time", "investor", "upgrader", "other"],
      project_status: ["coming_soon", "registering", "active", "sold_out"],
      project_type: ["condo", "townhome", "mixed", "duplex", "single_family"],
    },
  },
} as const
