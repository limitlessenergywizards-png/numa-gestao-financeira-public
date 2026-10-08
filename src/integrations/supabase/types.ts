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
      ai_conversations: {
        Row: {
          archived: boolean | null
          company_id: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          company_id: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          company_id?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_archive: {
        Row: {
          archived_at: string | null
          id: string
          partition_name: string
          period_end: string
          period_start: string
          record_count: number
          summary: Json
        }
        Insert: {
          archived_at?: string | null
          id?: string
          partition_name: string
          period_end: string
          period_start: string
          record_count: number
          summary: Json
        }
        Update: {
          archived_at?: string | null
          id?: string
          partition_name?: string
          period_end?: string
          period_start?: string
          record_count?: number
          summary?: Json
        }
        Relationships: []
      }
      audit_logs_default: {
        Row: {
          action: string
          changed_fields: string[] | null
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_old: {
        Row: {
          action: string
          changed_fields: string[] | null
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_y2026m01: {
        Row: {
          action: string
          changed_fields: string[] | null
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_y2026m02: {
        Row: {
          action: string
          changed_fields: string[] | null
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_y2026m03: {
        Row: {
          action: string
          changed_fields: string[] | null
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_y2026m04: {
        Row: {
          action: string
          changed_fields: string[] | null
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_y2026m05: {
        Row: {
          action: string
          changed_fields: string[] | null
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_y2026m06: {
        Row: {
          action: string
          changed_fields: string[] | null
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          account_type: Database["public"]["Enums"]["bank_account_type"]
          agency: string | null
          bank_name: string | null
          company_id: string
          created_at: string
          current_balance: number
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          id: string
          initial_balance: number
          is_active: boolean
          is_deleted: boolean
          name: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type?: Database["public"]["Enums"]["bank_account_type"]
          agency?: string | null
          bank_name?: string | null
          company_id: string
          created_at?: string
          current_balance?: number
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          is_deleted?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: Database["public"]["Enums"]["bank_account_type"]
          agency?: string | null
          bank_name?: string | null
          company_id?: string
          created_at?: string
          current_balance?: number
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          is_deleted?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_statement_imports: {
        Row: {
          bank_account_id: string
          company_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          detected_bank_name: string | null
          filename: string
          id: string
          import_date: string | null
          imported_by: string
          is_deleted: boolean
          period_end: string | null
          period_start: string | null
          total_credits: number | null
          total_debits: number | null
          total_transactions: number
        }
        Insert: {
          bank_account_id: string
          company_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          detected_bank_name?: string | null
          filename: string
          id?: string
          import_date?: string | null
          imported_by: string
          is_deleted?: boolean
          period_end?: string | null
          period_start?: string | null
          total_credits?: number | null
          total_debits?: number | null
          total_transactions?: number
        }
        Update: {
          bank_account_id?: string
          company_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          detected_bank_name?: string | null
          filename?: string
          id?: string
          import_date?: string | null
          imported_by?: string
          is_deleted?: boolean
          period_end?: string | null
          period_start?: string | null
          total_credits?: number | null
          total_debits?: number | null
          total_transactions?: number
        }
        Relationships: [
          {
            foreignKeyName: "bank_statement_imports_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_statements: {
        Row: {
          amount: number
          bank_account_id: string
          check_number: string | null
          company_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string
          fitid: string
          id: string
          import_id: string | null
          imported_at: string | null
          imported_by: string
          is_deleted: boolean
          memo: string | null
          reconciled: boolean | null
          reconciled_at: string | null
          reconciled_by: string | null
          reconciled_transaction_id: string | null
          source_file: string | null
          transaction_date: string
          type: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          check_number?: string | null
          company_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description: string
          fitid: string
          id?: string
          import_id?: string | null
          imported_at?: string | null
          imported_by: string
          is_deleted?: boolean
          memo?: string | null
          reconciled?: boolean | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciled_transaction_id?: string | null
          source_file?: string | null
          transaction_date: string
          type: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          check_number?: string | null
          company_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string
          fitid?: string
          id?: string
          import_id?: string | null
          imported_at?: string | null
          imported_by?: string
          is_deleted?: boolean
          memo?: string | null
          reconciled?: boolean | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciled_transaction_id?: string | null
          source_file?: string | null
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statements_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statements_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "bank_statement_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statements_reconciled_transaction_id_fkey"
            columns: ["reconciled_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      breakeven_simulations: {
        Row: {
          adjustments: Json
          base_snapshot_id: string | null
          breakeven_delta: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_viable: boolean | null
          months_to_breakeven: number | null
          name: string
          profit_delta: number | null
          revenue_delta: number | null
          roi_percentage: number | null
          simulated_break_even_point: number
          simulated_contribution_margin_percentage: number
          simulated_fixed_costs: number
          simulated_net_profit: number
          simulated_revenue: number
          simulated_variable_costs: number
        }
        Insert: {
          adjustments: Json
          base_snapshot_id?: string | null
          breakeven_delta?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_viable?: boolean | null
          months_to_breakeven?: number | null
          name: string
          profit_delta?: number | null
          revenue_delta?: number | null
          roi_percentage?: number | null
          simulated_break_even_point: number
          simulated_contribution_margin_percentage: number
          simulated_fixed_costs: number
          simulated_net_profit: number
          simulated_revenue: number
          simulated_variable_costs: number
        }
        Update: {
          adjustments?: Json
          base_snapshot_id?: string | null
          breakeven_delta?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_viable?: boolean | null
          months_to_breakeven?: number | null
          name?: string
          profit_delta?: number | null
          revenue_delta?: number | null
          roi_percentage?: number | null
          simulated_break_even_point?: number
          simulated_contribution_margin_percentage?: number
          simulated_fixed_costs?: number
          simulated_net_profit?: number
          simulated_revenue?: number
          simulated_variable_costs?: number
        }
        Relationships: [
          {
            foreignKeyName: "breakeven_simulations_base_snapshot_id_fkey"
            columns: ["base_snapshot_id"]
            isOneToOne: false
            referencedRelation: "financial_health_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breakeven_simulations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          company_id: string
          cost_type: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          name: string
          type: string
          updated_at: string | null
          variable_percentage: number | null
        }
        Insert: {
          color?: string | null
          company_id: string
          cost_type?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          variable_percentage?: number | null
        }
        Update: {
          color?: string | null
          company_id?: string
          cost_type?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          variable_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          company_id: string
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          id: string
          rank: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          rank?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          rank?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_account_template_dre_mapping: {
        Row: {
          account_codes: string[]
          created_at: string | null
          display_order: number | null
          dre_line_id: string
          dre_line_name: string
          id: string
          operation: string
          template_id: string
        }
        Insert: {
          account_codes?: string[]
          created_at?: string | null
          display_order?: number | null
          dre_line_id: string
          dre_line_name: string
          id?: string
          operation?: string
          template_id: string
        }
        Update: {
          account_codes?: string[]
          created_at?: string | null
          display_order?: number | null
          dre_line_id?: string
          dre_line_name?: string
          id?: string
          operation?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_account_template_dre_mapping_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "chart_account_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_account_template_items: {
        Row: {
          code: string
          created_at: string | null
          display_order: number | null
          dre_category: string | null
          id: string
          is_analytical: boolean | null
          is_system: boolean | null
          level: number
          name: string
          nature: string
          parent_code: string | null
          template_id: string
          type: Database["public"]["Enums"]["account_entry_type"]
        }
        Insert: {
          code: string
          created_at?: string | null
          display_order?: number | null
          dre_category?: string | null
          id?: string
          is_analytical?: boolean | null
          is_system?: boolean | null
          level?: number
          name: string
          nature?: string
          parent_code?: string | null
          template_id: string
          type: Database["public"]["Enums"]["account_entry_type"]
        }
        Update: {
          code?: string
          created_at?: string | null
          display_order?: number | null
          dre_category?: string | null
          id?: string
          is_analytical?: boolean | null
          is_system?: boolean | null
          level?: number
          name?: string
          nature?: string
          parent_code?: string | null
          template_id?: string
          type?: Database["public"]["Enums"]["account_entry_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chart_account_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "chart_account_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_account_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          is_system: boolean | null
          name: string
          segment: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          name: string
          segment?: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          name?: string
          segment?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          code: string
          company_id: string
          cost_type: string | null
          created_at: string
          dre_category: string | null
          id: string
          is_active: boolean
          is_analytical: boolean | null
          name: string
          nature: string | null
          parent_id: string | null
          type: Database["public"]["Enums"]["account_entry_type"]
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          cost_type?: string | null
          created_at?: string
          dre_category?: string | null
          id?: string
          is_active?: boolean
          is_analytical?: boolean | null
          name: string
          nature?: string | null
          parent_id?: string | null
          type: Database["public"]["Enums"]["account_entry_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          cost_type?: string | null
          created_at?: string
          dre_category?: string | null
          id?: string
          is_active?: boolean
          is_analytical?: boolean | null
          name?: string
          nature?: string | null
          parent_id?: string | null
          type?: Database["public"]["Enums"]["account_entry_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      clawos_pipelines: {
        Row: {
          accent_color: string | null
          card_fields: Json
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          stages: Json
        }
        Insert: {
          accent_color?: string | null
          card_fields?: Json
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id: string
          is_active?: boolean | null
          name: string
          stages?: Json
        }
        Update: {
          accent_color?: string | null
          card_fields?: Json
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          stages?: Json
        }
        Relationships: []
      }
      clawos_tasks: {
        Row: {
          assignees: string[]
          created_at: string | null
          description: string | null
          due_date: string | null
          fields: Json
          id: string
          pipeline_id: string
          priority: string | null
          stage_id: string | null
          status: string | null
          tags: string[]
          title: string
          updated_at: string | null
        }
        Insert: {
          assignees?: string[]
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          fields?: Json
          id?: string
          pipeline_id?: string
          priority?: string | null
          stage_id?: string | null
          status?: string | null
          tags?: string[]
          title: string
          updated_at?: string | null
        }
        Update: {
          assignees?: string[]
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          fields?: Json
          id?: string
          pipeline_id?: string
          priority?: string | null
          stage_id?: string | null
          status?: string | null
          tags?: string[]
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          complement: string | null
          created_at: string
          created_by: string | null
          currency: string
          currency_symbol: string
          document: string | null
          email: string | null
          id: string
          is_headquarters: boolean
          logo_url: string | null
          mobile_phone: string | null
          name: string
          neighborhood: string | null
          number: string | null
          parent_company_id: string | null
          phone: string | null
          segment: string | null
          state: string | null
          tax_regime: string | null
          trading_name: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          currency_symbol?: string
          document?: string | null
          email?: string | null
          id?: string
          is_headquarters?: boolean
          logo_url?: string | null
          mobile_phone?: string | null
          name: string
          neighborhood?: string | null
          number?: string | null
          parent_company_id?: string | null
          phone?: string | null
          segment?: string | null
          state?: string | null
          tax_regime?: string | null
          trading_name?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          currency_symbol?: string
          document?: string | null
          email?: string | null
          id?: string
          is_headquarters?: boolean
          logo_url?: string | null
          mobile_phone?: string | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          parent_company_id?: string | null
          phone?: string | null
          segment?: string | null
          state?: string | null
          tax_regime?: string | null
          trading_name?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          code: string
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_id: string
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activity_log: {
        Row: {
          activities_count: number | null
          activity_date: string
          company_id: string
          created_at: string | null
          id: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          activities_count?: number | null
          activity_date: string
          company_id: string
          created_at?: string | null
          id?: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          activities_count?: number | null
          activity_date?: string
          company_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_missions: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          current_value: number | null
          description: string | null
          expires_at: string | null
          id: string
          mission_type: string
          reward_xp: number | null
          status: string | null
          target_value: number | null
          title: string
          user_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          mission_type: string
          reward_xp?: number | null
          status?: string | null
          target_value?: number | null
          title: string
          user_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          mission_type?: string
          reward_xp?: number | null
          status?: string | null
          target_value?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_missions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          balance_after: number
          company_id: string
          created_at: string | null
          debt_id: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          due_date: string
          fees_amount: number | null
          id: string
          installment_number: number | null
          interest_amount: number
          is_deleted: boolean
          is_late: boolean | null
          late_days: number | null
          late_fee: number | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          principal_amount: number
          total_amount: number
          transaction_id: string | null
        }
        Insert: {
          balance_after: number
          company_id: string
          created_at?: string | null
          debt_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          due_date: string
          fees_amount?: number | null
          id?: string
          installment_number?: number | null
          interest_amount: number
          is_deleted?: boolean
          is_late?: boolean | null
          late_days?: number | null
          late_fee?: number | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          principal_amount: number
          total_amount: number
          transaction_id?: string | null
        }
        Update: {
          balance_after?: number
          company_id?: string
          created_at?: string | null
          debt_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          due_date?: string
          fees_amount?: number | null
          id?: string
          installment_number?: number | null
          interest_amount?: number
          is_deleted?: boolean
          is_late?: boolean | null
          late_days?: number | null
          late_fee?: number | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          principal_amount?: number
          total_amount?: number
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payoff_plans: {
        Row: {
          activated_at: string | null
          company_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          current_scenario_months: number | null
          debt_free_date: string
          debts_order: Json
          description: string | null
          id: string
          interest_saved: number | null
          monthly_payment: number
          months_saved: number | null
          months_to_debt_free: number
          name: string
          on_track: boolean | null
          payment_schedule: Json | null
          progress_percentage: number | null
          start_date: string
          status: string | null
          strategy: string
          total_debt_amount: number
          total_interest_projected: number
        }
        Insert: {
          activated_at?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_scenario_months?: number | null
          debt_free_date: string
          debts_order: Json
          description?: string | null
          id?: string
          interest_saved?: number | null
          monthly_payment: number
          months_saved?: number | null
          months_to_debt_free: number
          name: string
          on_track?: boolean | null
          payment_schedule?: Json | null
          progress_percentage?: number | null
          start_date: string
          status?: string | null
          strategy: string
          total_debt_amount: number
          total_interest_projected: number
        }
        Update: {
          activated_at?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_scenario_months?: number | null
          debt_free_date?: string
          debts_order?: Json
          description?: string | null
          id?: string
          interest_saved?: number | null
          monthly_payment?: number
          months_saved?: number | null
          months_to_debt_free?: number
          name?: string
          on_track?: boolean | null
          payment_schedule?: Json | null
          progress_percentage?: number | null
          start_date?: string
          status?: string | null
          strategy?: string
          total_debt_amount?: number
          total_interest_projected?: number
        }
        Relationships: [
          {
            foreignKeyName: "debt_payoff_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          attachments: Json | null
          category_id: string | null
          change_log: Json | null
          company_id: string
          contract_date: string
          contract_url: string | null
          created_at: string | null
          created_by: string | null
          creditor_name: string
          creditor_type: string | null
          current_balance: number
          debt_type: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          due_day: number | null
          early_payoff_discount: number | null
          first_due_date: string
          id: string
          installment_amount: number | null
          insurance_fee: number | null
          interest_period: string
          interest_rate: number
          interest_type: string
          is_deleted: boolean
          is_priority: boolean | null
          last_due_date: string | null
          monthly_fee: number | null
          months_remaining: number | null
          name: string
          notes: string | null
          original_amount: number
          paid_amount: number | null
          paid_installments: number | null
          paid_off_at: string | null
          payoff_date: string | null
          priority_score: number | null
          recurring_transaction_id: string | null
          renegotiation_notes: string | null
          setup_fee: number | null
          status: string
          tags: string[] | null
          total_installments: number | null
          total_interest_paid: number | null
          total_interest_projected: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          attachments?: Json | null
          category_id?: string | null
          change_log?: Json | null
          company_id: string
          contract_date: string
          contract_url?: string | null
          created_at?: string | null
          created_by?: string | null
          creditor_name: string
          creditor_type?: string | null
          current_balance: number
          debt_type: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          due_day?: number | null
          early_payoff_discount?: number | null
          first_due_date: string
          id?: string
          installment_amount?: number | null
          insurance_fee?: number | null
          interest_period: string
          interest_rate: number
          interest_type: string
          is_deleted?: boolean
          is_priority?: boolean | null
          last_due_date?: string | null
          monthly_fee?: number | null
          months_remaining?: number | null
          name: string
          notes?: string | null
          original_amount: number
          paid_amount?: number | null
          paid_installments?: number | null
          paid_off_at?: string | null
          payoff_date?: string | null
          priority_score?: number | null
          recurring_transaction_id?: string | null
          renegotiation_notes?: string | null
          setup_fee?: number | null
          status?: string
          tags?: string[] | null
          total_installments?: number | null
          total_interest_paid?: number | null
          total_interest_projected?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          attachments?: Json | null
          category_id?: string | null
          change_log?: Json | null
          company_id?: string
          contract_date?: string
          contract_url?: string | null
          created_at?: string | null
          created_by?: string | null
          creditor_name?: string
          creditor_type?: string | null
          current_balance?: number
          debt_type?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          due_day?: number | null
          early_payoff_discount?: number | null
          first_due_date?: string
          id?: string
          installment_amount?: number | null
          insurance_fee?: number | null
          interest_period?: string
          interest_rate?: number
          interest_type?: string
          is_deleted?: boolean
          is_priority?: boolean | null
          last_due_date?: string | null
          monthly_fee?: number | null
          months_remaining?: number | null
          name?: string
          notes?: string | null
          original_amount?: number
          paid_amount?: number | null
          paid_installments?: number | null
          paid_off_at?: string | null
          payoff_date?: string | null
          priority_score?: number | null
          recurring_transaction_id?: string | null
          renegotiation_notes?: string | null
          setup_fee?: number | null
          status?: string
          tags?: string[] | null
          total_installments?: number | null
          total_interest_paid?: number | null
          total_interest_projected?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_recurring_transaction_id_fkey"
            columns: ["recurring_transaction_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      dre_budget: {
        Row: {
          budgeted_value: number
          category_code: string
          category_name: string
          company_id: string
          created_at: string | null
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          id: string
          is_deleted: boolean
          period_month: number
          period_year: number
          updated_at: string | null
        }
        Insert: {
          budgeted_value?: number
          category_code: string
          category_name: string
          company_id: string
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          is_deleted?: boolean
          period_month: number
          period_year: number
          updated_at?: string | null
        }
        Update: {
          budgeted_value?: number
          category_code?: string
          category_name?: string
          company_id?: string
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          is_deleted?: boolean
          period_month?: number
          period_year?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dre_budget_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dre_email_logs: {
        Row: {
          company_id: string
          created_at: string | null
          error_message: string | null
          id: string
          opened_at: string | null
          recipient_emails: string[]
          report_period: string | null
          resend_id: string | null
          schedule_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_emails: string[]
          report_period?: string | null
          resend_id?: string | null
          schedule_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_emails?: string[]
          report_period?: string | null
          resend_id?: string | null
          schedule_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dre_email_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dre_email_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "dre_report_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      dre_notes: {
        Row: {
          chart_account_id: string | null
          company_id: string
          created_at: string | null
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          dre_line_id: string
          id: string
          is_deleted: boolean
          is_important: boolean | null
          note: string
          period_month: number
          period_year: number
          updated_at: string | null
        }
        Insert: {
          chart_account_id?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          dre_line_id: string
          id?: string
          is_deleted?: boolean
          is_important?: boolean | null
          note: string
          period_month: number
          period_year: number
          updated_at?: string | null
        }
        Update: {
          chart_account_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          dre_line_id?: string
          id?: string
          is_deleted?: boolean
          is_important?: boolean | null
          note?: string
          period_month?: number
          period_year?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dre_notes_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dre_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dre_report_schedules: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          day_of_month: number | null
          id: string
          include_excel: boolean | null
          include_pdf: boolean | null
          is_active: boolean | null
          last_sent_at: string | null
          next_send_at: string | null
          recipient_emails: string[]
          report_period: string | null
          schedule_type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          day_of_month?: number | null
          id?: string
          include_excel?: boolean | null
          include_pdf?: boolean | null
          is_active?: boolean | null
          last_sent_at?: string | null
          next_send_at?: string | null
          recipient_emails: string[]
          report_period?: string | null
          schedule_type?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          day_of_month?: number | null
          id?: string
          include_excel?: boolean | null
          include_pdf?: boolean | null
          is_active?: boolean | null
          last_sent_at?: string | null
          next_send_at?: string | null
          recipient_emails?: string[]
          report_period?: string | null
          schedule_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dre_report_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_health_snapshots: {
        Row: {
          break_even_point: number
          break_even_units: number | null
          breakeven_coverage_percentage: number | null
          calculated_at: string | null
          calculation_source: string | null
          company_id: string
          contribution_margin: number
          contribution_margin_percentage: number
          cost_growth_percentage: number | null
          fixed_costs: number
          fixed_costs_breakdown: Json | null
          gross_margin: number
          gross_margin_percentage: number
          health_score: number | null
          health_status: string | null
          id: string
          net_margin_percentage: number
          net_profit: number
          profit_growth_percentage: number | null
          projected_breakeven_date: string | null
          projected_next_month_revenue: number | null
          reference_month: string
          revenue_above_breakeven: number | null
          revenue_growth_percentage: number | null
          safety_margin: number | null
          safety_margin_percentage: number | null
          total_revenue: number
          variable_cost_percentage: number
          variable_costs: number
          variable_costs_breakdown: Json | null
        }
        Insert: {
          break_even_point?: number
          break_even_units?: number | null
          breakeven_coverage_percentage?: number | null
          calculated_at?: string | null
          calculation_source?: string | null
          company_id: string
          contribution_margin?: number
          contribution_margin_percentage?: number
          cost_growth_percentage?: number | null
          fixed_costs?: number
          fixed_costs_breakdown?: Json | null
          gross_margin?: number
          gross_margin_percentage?: number
          health_score?: number | null
          health_status?: string | null
          id?: string
          net_margin_percentage?: number
          net_profit?: number
          profit_growth_percentage?: number | null
          projected_breakeven_date?: string | null
          projected_next_month_revenue?: number | null
          reference_month: string
          revenue_above_breakeven?: number | null
          revenue_growth_percentage?: number | null
          safety_margin?: number | null
          safety_margin_percentage?: number | null
          total_revenue?: number
          variable_cost_percentage?: number
          variable_costs?: number
          variable_costs_breakdown?: Json | null
        }
        Update: {
          break_even_point?: number
          break_even_units?: number | null
          breakeven_coverage_percentage?: number | null
          calculated_at?: string | null
          calculation_source?: string | null
          company_id?: string
          contribution_margin?: number
          contribution_margin_percentage?: number
          cost_growth_percentage?: number | null
          fixed_costs?: number
          fixed_costs_breakdown?: Json | null
          gross_margin?: number
          gross_margin_percentage?: number
          health_score?: number | null
          health_status?: string | null
          id?: string
          net_margin_percentage?: number
          net_profit?: number
          profit_growth_percentage?: number | null
          projected_breakeven_date?: string | null
          projected_next_month_revenue?: number | null
          reference_month?: string
          revenue_above_breakeven?: number | null
          revenue_growth_percentage?: number | null
          safety_margin?: number | null
          safety_margin_percentage?: number | null
          total_revenue?: number
          variable_cost_percentage?: number
          variable_costs?: number
          variable_costs_breakdown?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_health_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_personality: {
        Row: {
          archetype: string
          archetype_score: Json | null
          company_id: string
          created_at: string
          growth_areas: string[] | null
          id: string
          last_analysis_at: string | null
          quiz_answers: Json | null
          strengths: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archetype?: string
          archetype_score?: Json | null
          company_id: string
          created_at?: string
          growth_areas?: string[] | null
          id?: string
          last_analysis_at?: string | null
          quiz_answers?: Json | null
          strengths?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archetype?: string
          archetype_score?: Json | null
          company_id?: string
          created_at?: string
          growth_areas?: string[] | null
          id?: string
          last_analysis_at?: string | null
          quiz_answers?: Json | null
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_personality_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hotmart_webhook_logs: {
        Row: {
          buyer_email: string | null
          created_at: string | null
          error_message: string | null
          event: string
          id: string
          payload: Json
          status: string | null
        }
        Insert: {
          buyer_email?: string | null
          created_at?: string | null
          error_message?: string | null
          event: string
          id?: string
          payload: Json
          status?: string | null
        }
        Update: {
          buyer_email?: string | null
          created_at?: string | null
          error_message?: string | null
          event?: string
          id?: string
          payload?: Json
          status?: string | null
        }
        Relationships: []
      }
      journey_milestones: {
        Row: {
          company_id: string
          description: string | null
          icon: string | null
          id: string
          metadata: Json | null
          milestone_type: string
          narrative: string | null
          title: string
          unlocked_at: string | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          company_id: string
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          milestone_type: string
          narrative?: string | null
          title: string
          unlocked_at?: string | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          company_id?: string
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          milestone_type?: string
          narrative?: string | null
          title?: string
          unlocked_at?: string | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          achievements_count: number | null
          challenges_won: number | null
          company_id: string
          id: string
          missions_completed: number | null
          period_key: string
          period_type: string
          rank: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievements_count?: number | null
          challenges_won?: number | null
          company_id: string
          id?: string
          missions_completed?: number | null
          period_key: string
          period_type: string
          rank?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievements_count?: number | null
          challenges_won?: number | null
          company_id?: string
          id?: string
          missions_completed?: number | null
          period_key?: string
          period_type?: string
          rank?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ad_id: string | null
          adset_id: string | null
          agente_ativo: boolean | null
          agente_desativado_at: string | null
          agente_desativado_motivo: string | null
          atendente_id: string | null
          atendente_nome: string | null
          campaign_id: string | null
          company_id: string | null
          contexto_pendente: Json | null
          contexto_pendente_expira: string | null
          contextos_importantes: Json | null
          converteu_cliente: boolean | null
          created_at: string
          ctwa_clid: string | null
          dados_onboarding: Json | null
          data_conversao: string | null
          data_oferta: string | null
          dor_principal: string | null
          email: string | null
          etapa_onboarding: number | null
          funnel_stage: string | null
          id: string
          instancia_evolution: string
          legacy_id: number | null
          lid_id: string | null
          link_checkout: string | null
          ltv_estimado: number | null
          metadata: Json | null
          nome: string | null
          objetivo_principal: string | null
          oferta_enviada: boolean | null
          onboarding_completo: boolean | null
          origem: string | null
          perfil_financeiro: string | null
          primeira_mensagem_at: string
          profile_id: string | null
          profile_picture_url: string | null
          remote_jid: string | null
          resumo_conversa: string | null
          score_engajamento: number | null
          session_id: string | null
          status: string | null
          subscription_id: string | null
          tags: string[] | null
          telefone: string | null
          telefone_formatado: string | null
          tempo_medio_resposta: number | null
          tipo_oferta: string | null
          total_audios_recebidos: number | null
          total_imagens_recebidas: number | null
          total_mensagens_enviadas: number | null
          total_mensagens_recebidas: number | null
          total_transacoes_registradas: number | null
          ultima_mensagem_at: string
          ultima_resposta_at: string | null
          updated_at: string
          username_whatsapp: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ad_id?: string | null
          adset_id?: string | null
          agente_ativo?: boolean | null
          agente_desativado_at?: string | null
          agente_desativado_motivo?: string | null
          atendente_id?: string | null
          atendente_nome?: string | null
          campaign_id?: string | null
          company_id?: string | null
          contexto_pendente?: Json | null
          contexto_pendente_expira?: string | null
          contextos_importantes?: Json | null
          converteu_cliente?: boolean | null
          created_at?: string
          ctwa_clid?: string | null
          dados_onboarding?: Json | null
          data_conversao?: string | null
          data_oferta?: string | null
          dor_principal?: string | null
          email?: string | null
          etapa_onboarding?: number | null
          funnel_stage?: string | null
          id?: string
          instancia_evolution?: string
          legacy_id?: number | null
          lid_id?: string | null
          link_checkout?: string | null
          ltv_estimado?: number | null
          metadata?: Json | null
          nome?: string | null
          objetivo_principal?: string | null
          oferta_enviada?: boolean | null
          onboarding_completo?: boolean | null
          origem?: string | null
          perfil_financeiro?: string | null
          primeira_mensagem_at?: string
          profile_id?: string | null
          profile_picture_url?: string | null
          remote_jid?: string | null
          resumo_conversa?: string | null
          score_engajamento?: number | null
          session_id?: string | null
          status?: string | null
          subscription_id?: string | null
          tags?: string[] | null
          telefone?: string | null
          telefone_formatado?: string | null
          tempo_medio_resposta?: number | null
          tipo_oferta?: string | null
          total_audios_recebidos?: number | null
          total_imagens_recebidas?: number | null
          total_mensagens_enviadas?: number | null
          total_mensagens_recebidas?: number | null
          total_transacoes_registradas?: number | null
          ultima_mensagem_at?: string
          ultima_resposta_at?: string | null
          updated_at?: string
          username_whatsapp?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ad_id?: string | null
          adset_id?: string | null
          agente_ativo?: boolean | null
          agente_desativado_at?: string | null
          agente_desativado_motivo?: string | null
          atendente_id?: string | null
          atendente_nome?: string | null
          campaign_id?: string | null
          company_id?: string | null
          contexto_pendente?: Json | null
          contexto_pendente_expira?: string | null
          contextos_importantes?: Json | null
          converteu_cliente?: boolean | null
          created_at?: string
          ctwa_clid?: string | null
          dados_onboarding?: Json | null
          data_conversao?: string | null
          data_oferta?: string | null
          dor_principal?: string | null
          email?: string | null
          etapa_onboarding?: number | null
          funnel_stage?: string | null
          id?: string
          instancia_evolution?: string
          legacy_id?: number | null
          lid_id?: string | null
          link_checkout?: string | null
          ltv_estimado?: number | null
          metadata?: Json | null
          nome?: string | null
          objetivo_principal?: string | null
          oferta_enviada?: boolean | null
          onboarding_completo?: boolean | null
          origem?: string | null
          perfil_financeiro?: string | null
          primeira_mensagem_at?: string
          profile_id?: string | null
          profile_picture_url?: string | null
          remote_jid?: string | null
          resumo_conversa?: string | null
          score_engajamento?: number | null
          session_id?: string | null
          status?: string | null
          subscription_id?: string | null
          tags?: string[] | null
          telefone?: string | null
          telefone_formatado?: string | null
          tempo_medio_resposta?: number | null
          tipo_oferta?: string | null
          total_audios_recebidos?: number | null
          total_imagens_recebidas?: number | null
          total_mensagens_enviadas?: number | null
          total_mensagens_recebidas?: number | null
          total_transacoes_registradas?: number | null
          ultima_mensagem_at?: string
          ultima_resposta_at?: string | null
          updated_at?: string
          username_whatsapp?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_scans: {
        Row: {
          company_id: string
          created_at: string
          extracted_data: Json | null
          extracted_text: string
          id: string
          image_url: string
          linked_record_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          extracted_data?: Json | null
          extracted_text: string
          id?: string
          image_url: string
          linked_record_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          extracted_data?: Json | null
          extracted_text?: string
          id?: string
          image_url?: string
          linked_record_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocr_scans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          segment: string | null
          skipped_at: string | null
          started_at: string | null
          step_categorias: boolean | null
          step_contas_bancarias: boolean | null
          step_empresa: boolean | null
          step_primeiro_lancamento: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          segment?: string | null
          skipped_at?: string | null
          started_at?: string | null
          step_categorias?: boolean | null
          step_contas_bancarias?: boolean | null
          step_empresa?: boolean | null
          step_primeiro_lancamento?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          segment?: string | null
          skipped_at?: string | null
          started_at?: string | null
          step_categorias?: boolean | null
          step_contas_bancarias?: boolean | null
          step_empresa?: boolean | null
          step_primeiro_lancamento?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          amount: number
          category_code: string
          category_name: string
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          end_date: string
          id: string
          is_deleted: boolean
          notes: string | null
          period_type: string
          start_date: string
          target_type: Database["public"]["Enums"]["budget_target_type"] | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category_code: string
          category_name: string
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          end_date: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          period_type: string
          start_date: string
          target_type?: Database["public"]["Enums"]["budget_target_type"] | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category_code?: string
          category_name?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          end_date?: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          period_type?: string
          start_date?: string
          target_type?: Database["public"]["Enums"]["budget_target_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          bank_account_id: string | null
          category_id: string | null
          chart_account_id: string | null
          company_id: string
          cost_center_id: string | null
          created_at: string
          debt_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string
          document_number: string | null
          due_date: string
          id: string
          installment_number: number | null
          is_debt_payment: boolean | null
          is_deleted: boolean
          issue_date: string
          notes: string | null
          paid_amount: number
          parent_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          recurrence: string | null
          status: Database["public"]["Enums"]["payable_status"]
          supplier_id: string
          total_amount: number
          total_installments: number | null
          updated_at: string
        }
        Insert: {
          bank_account_id?: string | null
          category_id?: string | null
          chart_account_id?: string | null
          company_id: string
          cost_center_id?: string | null
          created_at?: string
          debt_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description: string
          document_number?: string | null
          due_date: string
          id?: string
          installment_number?: number | null
          is_debt_payment?: boolean | null
          is_deleted?: boolean
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          parent_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          recurrence?: string | null
          status?: Database["public"]["Enums"]["payable_status"]
          supplier_id: string
          total_amount: number
          total_installments?: number | null
          updated_at?: string
        }
        Update: {
          bank_account_id?: string | null
          category_id?: string | null
          chart_account_id?: string | null
          company_id?: string
          cost_center_id?: string | null
          created_at?: string
          debt_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string
          document_number?: string | null
          due_date?: string
          id?: string
          installment_number?: number | null
          is_debt_payment?: boolean | null
          is_deleted?: boolean
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          parent_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          recurrence?: string | null
          status?: Database["public"]["Enums"]["payable_status"]
          supplier_id?: string
          total_amount?: number
          total_installments?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payables_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "payables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          bank_account_id: string
          company_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          id: string
          is_deleted: boolean
          notes: string | null
          payable_id: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          receivable_id: string | null
        }
        Insert: {
          amount: number
          bank_account_id: string
          company_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          is_deleted?: boolean
          notes?: string | null
          payable_id?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receivable_id?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          is_deleted?: boolean
          notes?: string | null
          payable_id?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receivable_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "payables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number | null
          current_title: string | null
          full_name: string | null
          guardian_level: number | null
          hotmart_status: string | null
          hotmart_subscriber_code: string | null
          hotmart_transaction: string | null
          id: string
          job_title: string | null
          last_activity_date: string | null
          longest_streak: number | null
          phone: string | null
          total_xp: number | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number | null
          current_title?: string | null
          full_name?: string | null
          guardian_level?: number | null
          hotmart_status?: string | null
          hotmart_subscriber_code?: string | null
          hotmart_transaction?: string | null
          id?: string
          job_title?: string | null
          last_activity_date?: string | null
          longest_streak?: number | null
          phone?: string | null
          total_xp?: number | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number | null
          current_title?: string | null
          full_name?: string | null
          guardian_level?: number | null
          hotmart_status?: string | null
          hotmart_subscriber_code?: string | null
          hotmart_transaction?: string | null
          id?: string
          job_title?: string | null
          last_activity_date?: string | null
          longest_streak?: number | null
          phone?: string | null
          total_xp?: number | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      receivables: {
        Row: {
          bank_account_id: string | null
          category_id: string | null
          chart_account_id: string | null
          company_id: string
          created_at: string
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string
          document_number: string | null
          due_date: string
          id: string
          installment_number: number | null
          is_deleted: boolean
          issue_date: string
          notes: string | null
          paid_amount: number
          parent_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          recurrence: string | null
          status: Database["public"]["Enums"]["receivable_status"]
          total_amount: number
          total_installments: number | null
          updated_at: string
        }
        Insert: {
          bank_account_id?: string | null
          category_id?: string | null
          chart_account_id?: string | null
          company_id: string
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description: string
          document_number?: string | null
          due_date: string
          id?: string
          installment_number?: number | null
          is_deleted?: boolean
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          parent_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          recurrence?: string | null
          status?: Database["public"]["Enums"]["receivable_status"]
          total_amount: number
          total_installments?: number | null
          updated_at?: string
        }
        Update: {
          bank_account_id?: string | null
          category_id?: string | null
          chart_account_id?: string | null
          company_id?: string
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string
          document_number?: string | null
          due_date?: string
          id?: string
          installment_number?: number | null
          is_deleted?: boolean
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          parent_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          recurrence?: string | null
          status?: Database["public"]["Enums"]["receivable_status"]
          total_amount?: number
          total_installments?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
        ]
      }
      recurrence_templates: {
        Row: {
          amount: number
          bank_account_id: string | null
          category_id: string
          company_id: string
          created_at: string | null
          day_of_month: number
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id: string
          is_deleted: boolean
          last_generated_date: string | null
          name: string
          start_date: string
          status: Database["public"]["Enums"]["recurrence_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category_id: string
          company_id: string
          created_at?: string | null
          day_of_month: number
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          end_date?: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          is_deleted?: boolean
          last_generated_date?: string | null
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["recurrence_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category_id?: string
          company_id?: string
          created_at?: string | null
          day_of_month?: number
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          is_deleted?: boolean
          last_generated_date?: string | null
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["recurrence_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurrence_templates_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrence_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrence_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_occurrences: {
        Row: {
          actual_amount: number | null
          actual_date: string | null
          adjustment_reason: string | null
          company_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          id: string
          is_deleted: boolean
          materialized_at: string | null
          occurrence_number: number
          original_amount: number | null
          paid_at: string | null
          recurring_id: string
          scheduled_date: string
          status: string
          transaction_id: string
        }
        Insert: {
          actual_amount?: number | null
          actual_date?: string | null
          adjustment_reason?: string | null
          company_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          is_deleted?: boolean
          materialized_at?: string | null
          occurrence_number: number
          original_amount?: number | null
          paid_at?: string | null
          recurring_id: string
          scheduled_date: string
          status?: string
          transaction_id: string
        }
        Update: {
          actual_amount?: number | null
          actual_date?: string | null
          adjustment_reason?: string | null
          company_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          is_deleted?: boolean
          materialized_at?: string | null
          occurrence_number?: number
          original_amount?: number | null
          paid_at?: string | null
          recurring_id?: string
          scheduled_date?: string
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_occurrences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_occurrences_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_occurrences_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          amount: number
          amount_type: string | null
          bank_account_id: string | null
          category_id: string
          change_log: Json | null
          company_id: string
          create_as_forecast: boolean | null
          created_at: string | null
          created_by: string | null
          custom_interval_unit: string | null
          custom_interval_value: number | null
          day_of_month: number | null
          day_of_week: number | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          end_date: string | null
          ended_at: string | null
          forecast_confidence: number | null
          frequency: string
          holiday_adjustment: string | null
          id: string
          indexer: string | null
          indexer_month: number | null
          is_deleted: boolean
          name: string
          occurrence_count: number | null
          occurrence_limit: number | null
          paused_at: string | null
          skip_holidays: boolean | null
          skip_weekends: boolean | null
          start_date: string
          status: string
          type: string
          updated_at: string | null
          updated_by: string | null
          variable_basis: string | null
        }
        Insert: {
          amount: number
          amount_type?: string | null
          bank_account_id?: string | null
          category_id: string
          change_log?: Json | null
          company_id: string
          create_as_forecast?: boolean | null
          created_at?: string | null
          created_by?: string | null
          custom_interval_unit?: string | null
          custom_interval_value?: number | null
          day_of_month?: number | null
          day_of_week?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          end_date?: string | null
          ended_at?: string | null
          forecast_confidence?: number | null
          frequency: string
          holiday_adjustment?: string | null
          id?: string
          indexer?: string | null
          indexer_month?: number | null
          is_deleted?: boolean
          name: string
          occurrence_count?: number | null
          occurrence_limit?: number | null
          paused_at?: string | null
          skip_holidays?: boolean | null
          skip_weekends?: boolean | null
          start_date: string
          status?: string
          type: string
          updated_at?: string | null
          updated_by?: string | null
          variable_basis?: string | null
        }
        Update: {
          amount?: number
          amount_type?: string | null
          bank_account_id?: string | null
          category_id?: string
          change_log?: Json | null
          company_id?: string
          create_as_forecast?: boolean | null
          created_at?: string | null
          created_by?: string | null
          custom_interval_unit?: string | null
          custom_interval_value?: number | null
          day_of_month?: number | null
          day_of_week?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          end_date?: string | null
          ended_at?: string | null
          forecast_confidence?: number | null
          frequency?: string
          holiday_adjustment?: string | null
          id?: string
          indexer?: string | null
          indexer_month?: number | null
          is_deleted?: boolean
          name?: string
          occurrence_count?: number | null
          occurrence_limit?: number | null
          paused_at?: string | null
          skip_holidays?: boolean | null
          skip_weekends?: boolean | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          variable_basis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          company_id: string
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_metrics: {
        Row: {
          active_users_count: number
          company_id: string
          id: string
          last_transaction_at: string | null
          last_user_activity_at: string | null
          total_expenses: number | null
          total_revenue: number | null
          transactions_count: number
          updated_at: string | null
        }
        Insert: {
          active_users_count?: number
          company_id: string
          id?: string
          last_transaction_at?: string | null
          last_user_activity_at?: string | null
          total_expenses?: number | null
          total_revenue?: number | null
          transactions_count?: number
          updated_at?: string | null
        }
        Update: {
          active_users_count?: number
          company_id?: string
          id?: string
          last_transaction_at?: string | null
          last_user_activity_at?: string | null
          total_expenses?: number | null
          total_revenue?: number | null
          transactions_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_rules: {
        Row: {
          category_id: string
          company_id: string
          created_at: string
          description_match_type: string
          id: string
          is_active: boolean | null
          keyword: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          company_id: string
          created_at?: string
          description_match_type?: string
          id?: string
          is_active?: boolean | null
          keyword: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          company_id?: string
          created_at?: string
          description_match_type?: string
          id?: string
          is_active?: boolean | null
          keyword?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_rules_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          bank_account_id: string
          bank_statement_ref: string | null
          category_id: string | null
          chart_account_id: string | null
          company_id: string
          converted_at: string | null
          converted_by: string | null
          cost_center_id: string | null
          created_at: string
          customer_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string
          document_number: string | null
          forecast_basis: string | null
          forecast_confidence: number | null
          forecast_notes: string | null
          forecast_type: string | null
          id: string
          is_debt_payment: boolean | null
          is_deleted: boolean
          is_reversed: boolean
          linked_forecast_id: string | null
          nature: string
          notes: string | null
          original_created_at: string | null
          original_transaction_date: string | null
          payment_method: string | null
          reconciled: boolean | null
          reconciled_at: string | null
          reconciled_by: string | null
          recurrence: string | null
          recurrence_template_id: string | null
          reversal_of: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          supplier_id: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          bank_statement_ref?: string | null
          category_id?: string | null
          chart_account_id?: string | null
          company_id: string
          converted_at?: string | null
          converted_by?: string | null
          cost_center_id?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description: string
          document_number?: string | null
          forecast_basis?: string | null
          forecast_confidence?: number | null
          forecast_notes?: string | null
          forecast_type?: string | null
          id?: string
          is_debt_payment?: boolean | null
          is_deleted?: boolean
          is_reversed?: boolean
          linked_forecast_id?: string | null
          nature?: string
          notes?: string | null
          original_created_at?: string | null
          original_transaction_date?: string | null
          payment_method?: string | null
          reconciled?: boolean | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          recurrence?: string | null
          recurrence_template_id?: string | null
          reversal_of?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          supplier_id?: string | null
          transaction_date?: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          bank_statement_ref?: string | null
          category_id?: string | null
          chart_account_id?: string | null
          company_id?: string
          converted_at?: string | null
          converted_by?: string | null
          cost_center_id?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string
          document_number?: string | null
          forecast_basis?: string | null
          forecast_confidence?: number | null
          forecast_notes?: string | null
          forecast_type?: string | null
          id?: string
          is_debt_payment?: boolean | null
          is_deleted?: boolean
          is_reversed?: boolean
          linked_forecast_id?: string | null
          nature?: string
          notes?: string | null
          original_created_at?: string | null
          original_transaction_date?: string | null
          payment_method?: string | null
          reconciled?: boolean | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          recurrence?: string | null
          recurrence_template_id?: string | null
          reversal_of?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          supplier_id?: string | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_linked_forecast_id_fkey"
            columns: ["linked_forecast_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurrence_template_id_fkey"
            columns: ["recurrence_template_id"]
            isOneToOne: false
            referencedRelation: "recurrence_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          company_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          company_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          company_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_default: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          currency_format: string | null
          dashboard_layout: Json | null
          date_format: string | null
          email_notifications: boolean | null
          id: string
          notification_advance_days: number | null
          overdue_alerts: boolean | null
          push_enabled: boolean | null
          push_subscription: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          created_at?: string | null
          currency_format?: string | null
          dashboard_layout?: Json | null
          date_format?: string | null
          email_notifications?: boolean | null
          id?: string
          notification_advance_days?: number | null
          overdue_alerts?: boolean | null
          push_enabled?: boolean | null
          push_subscription?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          created_at?: string | null
          currency_format?: string | null
          dashboard_layout?: Json | null
          date_format?: string | null
          email_notifications?: boolean | null
          id?: string
          notification_advance_days?: number | null
          overdue_alerts?: boolean | null
          push_enabled?: boolean | null
          push_subscription?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_summary?: boolean | null
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
      user_sessions: {
        Row: {
          company_id: string | null
          device_info: Json | null
          id: string
          ip_address: string | null
          last_heartbeat: string
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          last_heartbeat?: string
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          last_heartbeat?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string | null
          description: string | null
          ends_at: string
          id: string
          is_active: boolean | null
          reward_badge: string | null
          reward_xp: number | null
          starts_at: string
          target_metric: string
          target_value: number
          title: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string | null
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean | null
          reward_badge?: string | null
          reward_xp?: number | null
          starts_at: string
          target_metric: string
          target_value: number
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean | null
          reward_badge?: string | null
          reward_xp?: number | null
          starts_at?: string
          target_metric?: string
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          company_id: string | null
          content: string | null
          created_at: string | null
          id: string
          lead_id: string
          role: string
          tool_call_id: string | null
          tool_name: string | null
        }
        Insert: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          role: string
          tool_call_id?: string | null
          tool_name?: string | null
        }
        Update: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          role?: string
          tool_call_id?: string | null
          tool_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_audit_partition_sizes: {
        Row: {
          dead_tuples: number | null
          live_tuples: number | null
          partition_name: unknown
          size: string | null
          size_bytes: number | null
        }
        Relationships: []
      }
      v_index_bloat_monitor: {
        Row: {
          index_name: unknown
          index_scans: number | null
          index_size: string | null
          index_size_bytes: number | null
          index_to_table_ratio: number | null
          potentially_unused: boolean | null
          schemaname: unknown
          table_name: unknown
          tuples_fetched: number | null
          tuples_read: number | null
        }
        Relationships: []
      }
      v_table_bloat_monitor: {
        Row: {
          dead_tuple_pct: number | null
          dead_tuples: number | null
          index_size: string | null
          last_analyze: string | null
          last_autoanalyze: string | null
          last_autovacuum: string | null
          last_vacuum: string | null
          live_tuples: number | null
          schemaname: unknown
          table_name: unknown
          table_size: string | null
          total_analyzes: number | null
          total_size: string | null
          total_vacuums: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _rls_ensure_cache: { Args: never; Returns: undefined }
      bulk_soft_delete_transactions: {
        Args: { p_company_id: string; p_ids: string[]; p_user_id?: string }
        Returns: undefined
      }
      bulk_update_payable_status: {
        Args: { p_ids: string[]; p_status: string }
        Returns: {
          bank_account_id: string | null
          category_id: string | null
          chart_account_id: string | null
          company_id: string
          cost_center_id: string | null
          created_at: string
          debt_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string
          document_number: string | null
          due_date: string
          id: string
          installment_number: number | null
          is_debt_payment: boolean | null
          is_deleted: boolean
          issue_date: string
          notes: string | null
          paid_amount: number
          parent_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          recurrence: string | null
          status: Database["public"]["Enums"]["payable_status"]
          supplier_id: string
          total_amount: number
          total_installments: number | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "payables"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      bulk_update_receivable_status: {
        Args: { p_ids: string[]; p_status: string }
        Returns: {
          bank_account_id: string | null
          category_id: string | null
          chart_account_id: string | null
          company_id: string
          created_at: string
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string
          document_number: string | null
          due_date: string
          id: string
          installment_number: number | null
          is_deleted: boolean
          issue_date: string
          notes: string | null
          paid_amount: number
          parent_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          recurrence: string | null
          status: Database["public"]["Enums"]["receivable_status"]
          total_amount: number
          total_installments: number | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "receivables"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      check_db_health: {
        Args: never
        Returns: {
          category: string
          message: string
          severity: string
          target_table: string
        }[]
      }
      convert_forecast_to_actual: {
        Args: {
          p_actual_amount: number
          p_converted_by?: string
          p_forecast_id: string
          p_keep_forecast?: boolean
          p_transaction_date?: string
        }
        Returns: Json
      }
      create_company_and_associate: {
        Args: {
          p_name: string
          p_trading_name?: string
          p_document?: string
          p_email?: string
          p_phone?: string
          p_mobile_phone?: string
          p_address?: string
          p_number?: string
          p_complement?: string
          p_neighborhood?: string
          p_city?: string
          p_state?: string
          p_zip_code?: string
          p_currency?: string
          p_currency_symbol?: string
          p_tax_regime?: string
          p_is_headquarters?: boolean
          p_logo_url?: string
          p_segment?: string
          p_is_default?: boolean
        }
        Returns: Json
      }
      create_audit_partition_if_needed: { Args: never; Returns: undefined }
      create_transaction_with_account: {
        Args: {
          p_amount?: number
          p_bank_account_id: string
          p_category_id?: string
          p_chart_account_id?: string
          p_company_id: string
          p_customer_id?: string
          p_description?: string
          p_document_number?: string
          p_forecast_basis?: string
          p_forecast_confidence?: number
          p_forecast_notes?: string
          p_forecast_type?: string
          p_nature?: string
          p_notes?: string
          p_payment_method?: string
          p_recurrence?: string
          p_supplier_id?: string
          p_transaction_date?: string
          p_type?: string
        }
        Returns: string
      }
      get_cashflow_projected: {
        Args: { p_company_id: string; p_end_date: string; p_start_date: string }
        Returns: {
          amount: number
          category_code: string
          category_name: string
          description: string
          entry_date: string
          entry_type: string
          id: string
          source: string
        }[]
      }
      get_cashflow_realized: {
        Args: {
          p_bank_account_id?: string
          p_company_id: string
          p_end_date: string
          p_start_date: string
        }
        Returns: {
          amount: number
          category_code: string
          category_name: string
          description: string
          entry_date: string
          entry_type: string
          forecast_basis: string
          id: string
          nature: string
          source: string
        }[]
      }
      get_financial_totals: {
        Args: { p_company_id: string; p_end_date: string; p_start_date: string }
        Returns: {
          current_balance: number
          despesas: number
          payables_paid: number
          payables_total: number
          receitas: number
          receivables_received: number
          receivables_total: number
        }[]
      }
      get_user_context: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_owner: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      process_debt_payments: { Args: { p_payments: Json }; Returns: undefined }
      recalculate_all_bank_balances: {
        Args: { p_company_id: string }
        Returns: {
          bank_account_id: string
          bank_name: string
          new_balance: number
          old_balance: number
        }[]
      }
      recalculate_bank_balance: {
        Args: { p_bank_account_id: string }
        Returns: number
      }
      reverse_transaction: {
        Args: {
          p_reason?: string
          p_transaction_id: string
          p_user_id?: string
        }
        Returns: string
      }
      user_belongs_to_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_entry_type:
        | "receita"
        | "despesa"
        | "custo"
        | "ativo"
        | "passivo"
        | "patrimonio"
      app_role: "admin" | "editor" | "viewer"
      bank_account_type: "corrente" | "poupanca" | "investimento" | "caixa"
      budget_target_type: "category" | "chart_account"
      payable_status: "pendente" | "parcial" | "pago" | "cancelado"
      payment_method:
        | "dinheiro"
        | "pix"
        | "transferencia"
        | "boleto"
        | "cartao"
        | "cartao_debito"
        | "cartao_credito"
        | "cheque"
      receivable_status: "pendente" | "parcial" | "pago" | "cancelado"
      recurrence_frequency:
        | "daily"
        | "weekly"
        | "biweekly"
        | "monthly"
        | "bimonthly"
        | "quarterly"
        | "semiannual"
        | "annual"
      recurrence_status: "active" | "paused" | "ended"
      transaction_type: "entrada" | "saida"
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
      account_entry_type: [
        "receita",
        "despesa",
        "custo",
        "ativo",
        "passivo",
        "patrimonio",
      ],
      app_role: ["admin", "editor", "viewer"],
      bank_account_type: ["corrente", "poupanca", "investimento", "caixa"],
      budget_target_type: ["category", "chart_account"],
      payable_status: ["pendente", "parcial", "pago", "cancelado"],
      payment_method: [
        "dinheiro",
        "pix",
        "transferencia",
        "boleto",
        "cartao",
        "cartao_debito",
        "cartao_credito",
        "cheque",
      ],
      receivable_status: ["pendente", "parcial", "pago", "cancelado"],
      recurrence_frequency: [
        "daily",
        "weekly",
        "biweekly",
        "monthly",
        "bimonthly",
        "quarterly",
        "semiannual",
        "annual",
      ],
      recurrence_status: ["active", "paused", "ended"],
      transaction_type: ["entrada", "saida"],
    },
  },
} as const

