export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      oanda_configs: {
        Row: {
          account_id: string
          api_key: string
          config_name: string
          created_at: string
          enabled: boolean | null
          environment: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          api_key: string
          config_name: string
          created_at?: string
          enabled?: boolean | null
          environment: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          api_key?: string
          config_name?: string
          created_at?: string
          enabled?: boolean | null
          environment?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      strategy_results: {
        Row: {
          commission: number | null
          created_at: string | null
          id: string
          initial_balance: number | null
          max_drawdown: number | null
          max_position_size: number | null
          position_sizing_mode: string | null
          profit_factor: number | null
          reverse_signals: boolean | null
          risk_model: string | null
          risk_per_trade: number | null
          risk_reward_ratio: number | null
          slippage: number | null
          spread: number | null
          stop_loss: number | null
          strategy_code: string
          strategy_name: string
          symbol: string
          take_profit: number | null
          timeframe: string
          total_return: number | null
          total_trades: number | null
          user_id: string
          win_rate: number | null
        }
        Insert: {
          commission?: number | null
          created_at?: string | null
          id?: string
          initial_balance?: number | null
          max_drawdown?: number | null
          max_position_size?: number | null
          position_sizing_mode?: string | null
          profit_factor?: number | null
          reverse_signals?: boolean | null
          risk_model?: string | null
          risk_per_trade?: number | null
          risk_reward_ratio?: number | null
          slippage?: number | null
          spread?: number | null
          stop_loss?: number | null
          strategy_code: string
          strategy_name: string
          symbol: string
          take_profit?: number | null
          timeframe: string
          total_return?: number | null
          total_trades?: number | null
          user_id: string
          win_rate?: number | null
        }
        Update: {
          commission?: number | null
          created_at?: string | null
          id?: string
          initial_balance?: number | null
          max_drawdown?: number | null
          max_position_size?: number | null
          position_sizing_mode?: string | null
          profit_factor?: number | null
          reverse_signals?: boolean | null
          risk_model?: string | null
          risk_per_trade?: number | null
          risk_reward_ratio?: number | null
          slippage?: number | null
          spread?: number | null
          stop_loss?: number | null
          strategy_code?: string
          strategy_name?: string
          symbol?: string
          take_profit?: number | null
          timeframe?: string
          total_return?: number | null
          total_trades?: number | null
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trading_logs: {
        Row: {
          id: string
          log_type: string
          message: string
          session_id: string
          timestamp: string
          trade_data: Json | null
          user_id: string
        }
        Insert: {
          id?: string
          log_type: string
          message: string
          session_id: string
          timestamp?: string
          trade_data?: Json | null
          user_id: string
        }
        Update: {
          id?: string
          log_type?: string
          message?: string
          session_id?: string
          timestamp?: string
          trade_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "trading_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_sessions: {
        Row: {
          created_at: string
          environment: string
          id: string
          is_active: boolean
          last_execution: string | null
          max_position_size: number
          oanda_account_id: string
          oanda_api_key: string
          reverse_signals: boolean
          risk_per_trade: number
          stop_loss: number
          strategy_code: string
          strategy_id: string
          symbol: string
          take_profit: number
          timeframe: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          environment: string
          id?: string
          is_active?: boolean
          last_execution?: string | null
          max_position_size?: number
          oanda_account_id: string
          oanda_api_key: string
          reverse_signals?: boolean
          risk_per_trade?: number
          stop_loss?: number
          strategy_code: string
          strategy_id: string
          symbol: string
          take_profit?: number
          timeframe: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          environment?: string
          id?: string
          is_active?: boolean
          last_execution?: string | null
          max_position_size?: number
          oanda_account_id?: string
          oanda_api_key?: string
          reverse_signals?: boolean
          risk_per_trade?: number
          stop_loss?: number
          strategy_code?: string
          strategy_id?: string
          symbol?: string
          take_profit?: number
          timeframe?: string
          updated_at?: string
          user_id?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
