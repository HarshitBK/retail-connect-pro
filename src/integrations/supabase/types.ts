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
      candidate_reservations: {
        Row: {
          created_at: string | null
          employee_id: string
          employer_id: string
          expires_at: string | null
          hired_at: string | null
          id: string
          offer_letter_url: string | null
          refund_amount: number | null
          refunded_at: string | null
          reservation_fee: number | null
          reserved_at: string | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          employer_id: string
          expires_at?: string | null
          hired_at?: string | null
          id?: string
          offer_letter_url?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          reservation_fee?: number | null
          reserved_at?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          employer_id?: string
          expires_at?: string | null
          hired_at?: string | null
          id?: string
          offer_letter_url?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          reservation_fee?: number | null
          reserved_at?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_reservations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_reservations_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_courses: {
        Row: {
          category: string | null
          content: Json | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          fee: number | null
          id: string
          is_active: boolean | null
          passing_score: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          fee?: number | null
          id?: string
          is_active?: boolean | null
          passing_score?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          fee?: number | null
          id?: string
          is_active?: boolean | null
          passing_score?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          created_at: string | null
          employee_id: string
          enrolled_at: string | null
          fee_paid: number | null
          id: string
          progress: number | null
          score: number | null
          status: Database["public"]["Enums"]["course_status"] | null
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          employee_id: string
          enrolled_at?: string | null
          fee_paid?: number | null
          id?: string
          progress?: number | null
          score?: number | null
          status?: Database["public"]["Enums"]["course_status"] | null
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          employee_id?: string
          enrolled_at?: string | null
          fee_paid?: number | null
          id?: string
          progress?: number | null
          score?: number | null
          status?: Database["public"]["Enums"]["course_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "certification_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          aadhar_document_url: string | null
          aadhar_number: string | null
          address_line1: string | null
          address_line2: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          certificates_urls: Json | null
          city: string | null
          created_at: string | null
          current_organization: string | null
          date_of_birth: string | null
          education_details: string | null
          education_grade: string | null
          education_level: string | null
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string
          gender: string | null
          id: string
          is_blacklisted: boolean | null
          pan_document_url: string | null
          pan_number: string | null
          payslips_urls: Json | null
          photo_url: string | null
          pincode: string | null
          preferred_work_cities: Json | null
          previous_organizations: Json | null
          profile_completion_percent: number | null
          reservation_expires_at: string | null
          reserved_by: string | null
          resume_url: string | null
          retail_categories: Json | null
          skills: Json | null
          state: string | null
          updated_at: string | null
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          aadhar_document_url?: string | null
          aadhar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          certificates_urls?: Json | null
          city?: string | null
          created_at?: string | null
          current_organization?: string | null
          date_of_birth?: string | null
          education_details?: string | null
          education_grade?: string | null
          education_level?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string
          gender?: string | null
          id?: string
          is_blacklisted?: boolean | null
          pan_document_url?: string | null
          pan_number?: string | null
          payslips_urls?: Json | null
          photo_url?: string | null
          pincode?: string | null
          preferred_work_cities?: Json | null
          previous_organizations?: Json | null
          profile_completion_percent?: number | null
          reservation_expires_at?: string | null
          reserved_by?: string | null
          resume_url?: string | null
          retail_categories?: Json | null
          skills?: Json | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          aadhar_document_url?: string | null
          aadhar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          certificates_urls?: Json | null
          city?: string | null
          created_at?: string | null
          current_organization?: string | null
          date_of_birth?: string | null
          education_details?: string | null
          education_grade?: string | null
          education_level?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string
          gender?: string | null
          id?: string
          is_blacklisted?: boolean | null
          pan_document_url?: string | null
          pan_number?: string | null
          payslips_urls?: Json | null
          photo_url?: string | null
          pincode?: string | null
          preferred_work_cities?: Json | null
          previous_organizations?: Json | null
          profile_completion_percent?: number | null
          reservation_expires_at?: string | null
          reserved_by?: string | null
          resume_url?: string | null
          retail_categories?: Json | null
          skills?: Json | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      employer_profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          cin_number: string | null
          city: string | null
          contact_person_designation: string | null
          contact_person_email: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          created_at: string | null
          gst_number: string | null
          id: string
          logo_url: string | null
          number_of_stores: number | null
          organization_name: string
          organization_type: string | null
          pan_number: string | null
          pincode: string | null
          retail_categories: Json | null
          state: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          cin_number?: string | null
          city?: string | null
          contact_person_designation?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string | null
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          number_of_stores?: number | null
          organization_name: string
          organization_type?: string | null
          pan_number?: string | null
          pincode?: string | null
          retail_categories?: Json | null
          state?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          cin_number?: string | null
          city?: string | null
          contact_person_designation?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string | null
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          number_of_stores?: number | null
          organization_name?: string
          organization_type?: string | null
          pan_number?: string | null
          pincode?: string | null
          retail_categories?: Json | null
          state?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      gift_redemptions: {
        Row: {
          gift_id: string
          id: string
          points_used: number
          redeemed_at: string | null
          shipping_address: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          gift_id: string
          id?: string
          points_used: number
          redeemed_at?: string | null
          shipping_address?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          gift_id?: string
          id?: string
          points_used?: number
          redeemed_at?: string | null
          shipping_address?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_redemptions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          points_required: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          points_required: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          points_required?: number
        }
        Relationships: []
      }
      hired_candidates: {
        Row: {
          blacklist_reason: string | null
          created_at: string | null
          employee_id: string
          employer_id: string
          hired_date: string | null
          id: string
          is_blacklisted: boolean | null
          offer_letter_url: string | null
          position: string | null
          rating: number | null
          rating_comment: string | null
          released_at: string | null
          reservation_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          blacklist_reason?: string | null
          created_at?: string | null
          employee_id: string
          employer_id: string
          hired_date?: string | null
          id?: string
          is_blacklisted?: boolean | null
          offer_letter_url?: string | null
          position?: string | null
          rating?: number | null
          rating_comment?: string | null
          released_at?: string | null
          reservation_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          blacklist_reason?: string | null
          created_at?: string | null
          employee_id?: string
          employer_id?: string
          hired_date?: string | null
          id?: string
          is_blacklisted?: boolean | null
          offer_letter_url?: string | null
          position?: string | null
          rating?: number | null
          rating_comment?: string | null
          released_at?: string | null
          reservation_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hired_candidates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hired_candidates_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hired_candidates_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "candidate_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      indian_cities: {
        Row: {
          id: string
          name: string
          state_id: string
        }
        Insert: {
          id?: string
          name: string
          state_id: string
        }
        Update: {
          id?: string
          name?: string
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indian_cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "indian_states"
            referencedColumns: ["id"]
          },
        ]
      }
      indian_states: {
        Row: {
          code: string
          id: string
          name: string
        }
        Insert: {
          code: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          created_at: string | null
          email: string | null
          expires_at: string
          id: string
          otp_code: string
          otp_type: string
          phone: string | null
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          expires_at: string
          id?: string
          otp_code: string
          otp_type: string
          phone?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          otp_type?: string
          phone?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          email_verified: boolean | null
          id: string
          phone: string | null
          phone_verified: boolean | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          id: string
          phone?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string | null
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          created_at: string | null
          id: string
          points_awarded: number
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points_awarded?: number
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points_awarded?: number
          referred_user_id?: string
          referrer_user_id?: string
        }
        Relationships: []
      }
      reward_points: {
        Row: {
          created_at: string | null
          id: string
          points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reward_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          points_change: number
          reference_id: string | null
          reference_type: string | null
          reward_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          points_change: number
          reference_id?: string | null
          reference_type?: string | null
          reward_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          points_change?: number
          reference_id?: string | null
          reference_type?: string | null
          reward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_transactions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "reward_points"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_test_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          delivered_questions: Json | null
          employee_id: string
          employer_charged: boolean | null
          fee_paid: number | null
          id: string
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["attempt_status"] | null
          test_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          delivered_questions?: Json | null
          employee_id: string
          employer_charged?: boolean | null
          fee_paid?: number | null
          id?: string
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"] | null
          test_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          delivered_questions?: Json | null
          employee_id?: string
          employer_charged?: boolean | null
          fee_paid?: number | null
          id?: string
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"] | null
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_test_attempts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "skill_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_tests: {
        Row: {
          approved_question_ids: Json | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          employer_fee_per_completion: number | null
          employer_id: string
          ends_at: string | null
          id: string
          location: string | null
          max_attempts: number | null
          passing_score: number | null
          position: string | null
          question_bank: Json | null
          questions: Json | null
          questions_to_show: number | null
          shuffle_options: boolean | null
          source_file_path: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["test_status"] | null
          test_fee: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_question_ids?: Json | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          employer_fee_per_completion?: number | null
          employer_id: string
          ends_at?: string | null
          id?: string
          location?: string | null
          max_attempts?: number | null
          passing_score?: number | null
          position?: string | null
          question_bank?: Json | null
          questions?: Json | null
          questions_to_show?: number | null
          shuffle_options?: boolean | null
          source_file_path?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["test_status"] | null
          test_fee?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_question_ids?: Json | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          employer_fee_per_completion?: number | null
          employer_id?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          max_attempts?: number | null
          passing_score?: number | null
          position?: string | null
          question_bank?: Json | null
          questions?: Json | null
          questions_to_show?: number | null
          shuffle_options?: boolean | null
          source_file_path?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["test_status"] | null
          test_fee?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_tests_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_expired_reservations: { Args: never; Returns: undefined }
      get_user_type: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      is_employee: { Args: { user_uuid: string }; Returns: boolean }
      is_employer: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      attempt_status: "in_progress" | "completed" | "abandoned"
      course_status: "enrolled" | "in_progress" | "completed"
      employment_status: "available" | "employed" | "reserved"
      reservation_status: "pending" | "hired" | "not_hired" | "expired"
      test_status: "draft" | "published" | "closed"
      transaction_type: "credit" | "debit" | "refund"
      user_type: "employee" | "employer"
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
      attempt_status: ["in_progress", "completed", "abandoned"],
      course_status: ["enrolled", "in_progress", "completed"],
      employment_status: ["available", "employed", "reserved"],
      reservation_status: ["pending", "hired", "not_hired", "expired"],
      test_status: ["draft", "published", "closed"],
      transaction_type: ["credit", "debit", "refund"],
      user_type: ["employee", "employer"],
    },
  },
} as const
