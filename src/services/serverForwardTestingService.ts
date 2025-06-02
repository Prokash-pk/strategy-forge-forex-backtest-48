
import { supabase } from '@/integrations/supabase/client';

export interface ServerTradingSession {
  user_id: string;
  strategy_id: string;
  strategy_code: string;
  symbol: string;
  timeframe: string;
  oanda_account_id: string;
  oanda_api_key: string;
  environment: 'practice' | 'live';
  risk_per_trade: number;
  stop_loss: number;
  take_profit: number;
  max_position_size: number;
  reverse_signals: boolean;
}

export interface TradingLog {
  id: string;
  session_id: string;
  user_id: string;
  log_type: 'trade' | 'error' | 'info';
  message: string;
  trade_data?: any;
  timestamp: string;
}

export interface TradingSessionRecord {
  id: string;
  user_id: string;
  strategy_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_execution: string;
}

export class ServerForwardTestingService {
  static async startServerSideForwardTesting(session: ServerTradingSession) {
    try {
      console.log('Starting server-side forward testing...');
      
      const { data, error } = await supabase.functions.invoke('oanda-forward-testing', {
        body: {
          action: 'start',
          session
        }
      });

      if (error) {
        throw error;
      }

      console.log('Server-side forward testing started:', data);
      return data;
    } catch (error) {
      console.error('Failed to start server-side forward testing:', error);
      throw error;
    }
  }

  static async stopServerSideForwardTesting(userId: string, strategyId: string) {
    try {
      console.log('Stopping server-side forward testing...');
      
      const { data, error } = await supabase.functions.invoke('oanda-forward-testing', {
        body: {
          action: 'stop',
          session: {
            user_id: userId,
            strategy_id: strategyId
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log('Server-side forward testing stopped:', data);
      return data;
    } catch (error) {
      console.error('Failed to stop server-side forward testing:', error);
      throw error;
    }
  }

  static async getActiveSessions(): Promise<TradingSessionRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First try the RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_active_trading_sessions', {
        p_user_id: user.id
      });

      if (!rpcError && rpcData) {
        return rpcData;
      }

      console.error('RPC error, falling back to direct query:', rpcError);
      
      // Fallback to direct query
      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      return [];
    }
  }

  static async getTradingLogs(sessionId?: string): Promise<TradingLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('trading_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get trading logs:', error);
      return [];
    }
  }
}
