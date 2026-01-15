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
          listing_key: string | null
          page_title: string | null
          page_url: string | null
          price: number | null
          project_id: string | null
          project_name: string | null
          property_type: string | null
          referrer: string | null
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
          listing_key?: string | null
          page_title?: string | null
          page_url?: string | null
          price?: number | null
          project_id?: string | null
          project_name?: string | null
          property_type?: string | null
          referrer?: string | null
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
          listing_key?: string | null
          page_title?: string | null
          page_url?: string | null
          price?: number | null
          project_id?: string | null
          project_name?: string | null
          property_type?: string | null
          referrer?: string | null
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
      developers: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          project_count: number | null
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          project_count?: number | null
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          project_count?: number | null
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          created_at: string
          html_content: string
          id: string
          name: string
          project_id: string | null
          recipient_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          name: string
          project_id?: string | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          name?: string
          project_id?: string | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presale_projects"
            referencedColumns: ["id"]
          },
        ]
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
          lead_id: string | null
          sent_at: string
          status: string
          subject: string
          template_type: string | null
        }
        Insert: {
          campaign_id?: string | null
          email_to: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          sent_at?: string
          status?: string
          subject: string
          template_type?: string | null
        }
        Update: {
          campaign_id?: string | null
          email_to?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          sent_at?: string
          status?: string
          subject?: string
          template_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
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
      expiration_notifications: {
        Row: {
          id: string
          listing_id: string
          notification_type: string
          sent_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          notification_type: string
          sent_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          notification_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expiration_notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
          map_lat: number | null
          map_lng: number | null
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
          visibility_mode: Database["public"]["Enums"]["visibility_mode"]
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
          map_lat?: number | null
          map_lng?: number | null
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
          visibility_mode?: Database["public"]["Enums"]["visibility_mode"]
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
          map_lat?: number | null
          map_lng?: number | null
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
          visibility_mode?: Database["public"]["Enums"]["visibility_mode"]
        }
        Relationships: []
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
          garage_spaces: number | null
          heating: string[] | null
          id: string
          interior_features: string[] | null
          last_synced_at: string
          latitude: number | null
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
          garage_spaces?: number | null
          heating?: string[] | null
          id?: string
          interior_features?: string[] | null
          last_synced_at?: string
          latitude?: number | null
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
          garage_spaces?: number | null
          heating?: string[] | null
          id?: string
          interior_features?: string[] | null
          last_synced_at?: string
          latitude?: number | null
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
          project_type: Database["public"]["Enums"]["project_type"]
          published_at: string | null
          rental_restrictions: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          starting_price: number | null
          status: Database["public"]["Enums"]["project_status"]
          strata_fees: string | null
          unit_mix: string | null
          updated_at: string
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
          project_type?: Database["public"]["Enums"]["project_type"]
          published_at?: string | null
          rental_restrictions?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          starting_price?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          strata_fees?: string | null
          unit_mix?: string | null
          updated_at?: string
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
          project_type?: Database["public"]["Enums"]["project_type"]
          published_at?: string | null
          rental_restrictions?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          starting_price?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          strata_fees?: string | null
          unit_mix?: string | null
          updated_at?: string
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
          agent_status: string | null
          budget: string | null
          city_interest: Json | null
          created_at: string
          drip_sequence: string | null
          email: string
          home_size: string | null
          id: string
          intent_score: number | null
          landing_page: string | null
          last_drip_sent: number | null
          lead_source: string | null
          message: string | null
          name: string
          next_drip_at: string | null
          persona: string | null
          phone: string | null
          project_id: string | null
          project_interest: Json | null
          referrer: string | null
          session_id: string | null
          timeline: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          agent_status?: string | null
          budget?: string | null
          city_interest?: Json | null
          created_at?: string
          drip_sequence?: string | null
          email: string
          home_size?: string | null
          id?: string
          intent_score?: number | null
          landing_page?: string | null
          last_drip_sent?: number | null
          lead_source?: string | null
          message?: string | null
          name: string
          next_drip_at?: string | null
          persona?: string | null
          phone?: string | null
          project_id?: string | null
          project_interest?: Json | null
          referrer?: string | null
          session_id?: string | null
          timeline?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          agent_status?: string | null
          budget?: string | null
          city_interest?: Json | null
          created_at?: string
          drip_sequence?: string | null
          email?: string
          home_size?: string | null
          id?: string
          intent_score?: number | null
          landing_page?: string | null
          last_drip_sent?: number | null
          lead_source?: string | null
          message?: string | null
          name?: string
          next_drip_at?: string | null
          persona?: string | null
          phone?: string | null
          project_id?: string | null
          project_interest?: Json | null
          referrer?: string | null
          session_id?: string | null
          timeline?: string | null
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
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
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
      public_agent_profiles: {
        Row: {
          avatar_url: string | null
          brokerage_name: string | null
          email: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          user_id: string | null
          verification_status:
            | Database["public"]["Enums"]["agent_verification_status"]
            | null
          verified_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
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
      agent_verification_status: "unverified" | "verified" | "rejected"
      app_role: "admin" | "moderator" | "user" | "developer"
      appointment_type: "preview" | "showing"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      buyer_timeline:
        | "0_3_months"
        | "3_6_months"
        | "6_12_months"
        | "12_plus_months"
      buyer_type: "first_time" | "investor" | "upgrader" | "other"
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
      project_status: "coming_soon" | "registering" | "active" | "sold_out"
      project_type: "condo" | "townhome" | "mixed" | "duplex" | "single_family"
      property_type: "condo" | "townhouse" | "other"
      unit_type:
        | "studio"
        | "1bed"
        | "1bed_den"
        | "2bed"
        | "2bed_den"
        | "3bed"
        | "penthouse"
      visibility_mode: "public" | "restricted"
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
      app_role: ["admin", "moderator", "user", "developer"],
      appointment_type: ["preview", "showing"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      buyer_timeline: [
        "0_3_months",
        "3_6_months",
        "6_12_months",
        "12_plus_months",
      ],
      buyer_type: ["first_time", "investor", "upgrader", "other"],
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
      project_status: ["coming_soon", "registering", "active", "sold_out"],
      project_type: ["condo", "townhome", "mixed", "duplex", "single_family"],
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
      visibility_mode: ["public", "restricted"],
    },
  },
} as const
