
import { supabase } from '@/integrations/supabase/client';

export interface TradingSessionRecord {
  id: string;
  user_id: string;
  strategy_id: string;
  strategy_name: string;
  strategy_code: string;
  symbol: string;
  timeframe: string;
  oanda_account_id: string;
  oanda_api_key: string;
  environment: 'practice' | 'live';
  is_active: boolean;
  created_at: string;
  last_execution: string;
}

export interface ServerTradingSession {
  user_id: string;
  strategy_id: string;
  strategy_name: string;
  strategy_code: string;
  symbol: string;
  timeframe: string;
  oanda_account_id: string;
  oanda_api_key: string;
  environment: 'practice' | 'live';
  risk_per_trade?: number;
  stop_loss?: number;
  take_profit?: number;
  max_position_size?: number;
  reverse_signals?: boolean;
  avoid_low_volume?: boolean;
}

export class ServerForwardTestingService {
  static async startServerSideForwardTesting(
    strategy: any,
    config: any,
    userId: string
  ): Promise<TradingSessionRecord> {
    try {
      console.log('🚀 Starting server-side forward testing session...');
      
      if (!strategy || !config || !userId) {
        throw new Error('Missing required parameters for server-side trading');
      }

      const sessionData = {
        user_id: userId,
        strategy_id: strategy.id,
        strategy_name: strategy.strategy_name,
        strategy_code: strategy.strategy_code,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        oanda_account_id: config.accountId,
        oanda_api_key: config.apiKey,
        environment: config.environment,
        is_active: true,
        last_execution: new Date().toISOString(),
        risk_per_trade: 2.0,
        stop_loss: 40,
        take_profit: 80,
        max_position_size: 100000,
        reverse_signals: false,
        avoid_low_volume: false
      };

      const { data: session, error } = await supabase
        .from('trading_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create server-side trading session:', error);
        throw error;
      }

      console.log('✅ Server-side trading session created:', session);
      return session as TradingSessionRecord;

    } catch (error) {
      console.error('❌ Failed to start server-side forward testing:', error);
      throw error;
    }
  }

  static async stopServerSideForwardTesting(userId: string): Promise<void> {
    try {
      console.log('⏹️ Stopping server-side forward testing for user:', userId);
      
      const { error } = await supabase
        .from('trading_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Failed to stop server-side trading sessions:', error);
        throw error;
      }

      console.log('✅ Server-side trading sessions stopped');

    } catch (error) {
      console.error('❌ Failed to stop server-side trading:', error);
      throw error;
    }
  }

  static async getActiveSessions(): Promise<TradingSessionRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return [];
      }

      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get active server sessions:', error);
        return [];
      }

      console.log(`📊 Found ${data?.length || 0} active server-side trading sessions`);
      return (data || []) as TradingSessionRecord[];
    } catch (error) {
      console.error('❌ Failed to get active server sessions:', error);
      return [];
    }
  }

  static async checkServerStatus(): Promise<{ isRunning: boolean; sessionsCount: number }> {
    try {
      const sessions = await this.getActiveSessions();
      return {
        isRunning: sessions.length > 0,
        sessionsCount: sessions.length
      };
    } catch (error) {
      console.error('❌ Failed to check server status:', error);
      return { isRunning: false, sessionsCount: 0 };
    }
  }
}
