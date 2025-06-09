import { supabase } from '@/integrations/supabase/client';

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
  risk_per_trade: number;
  stop_loss: number;
  take_profit: number;
  max_position_size: number;
  reverse_signals: boolean;
  avoid_low_volume?: boolean;
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
  strategy_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_execution: string;
  symbol: string;
  timeframe: string;
  environment: 'practice' | 'live';
}

export class ServerForwardTestingService {
  static async startServerSideForwardTesting(
    strategy: any, 
    oandaConfig: any, 
    userId: string
  ): Promise<TradingSessionRecord> {
    try {
      console.log('🚀 Starting server-side forward testing for strategy:', strategy?.strategy_name);
      
      // First, deactivate any existing sessions for this user/strategy combination
      await this.stopExistingUserSessions(userId);
      
      // Create trading session in database with all required fields
      const sessionData = {
        user_id: userId,
        strategy_id: strategy.id || strategy.strategy_name,
        strategy_name: strategy.strategy_name,
        strategy_code: strategy.strategy_code,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        oanda_account_id: oandaConfig.accountId,
        oanda_api_key: oandaConfig.apiKey,
        environment: oandaConfig.environment,
        risk_per_trade: strategy.risk_per_trade || 2.0,
        stop_loss: strategy.stop_loss || 40,
        take_profit: strategy.take_profit || 80,
        max_position_size: strategy.max_position_size || 100000,
        reverse_signals: strategy.reverse_signals || false,
        avoid_low_volume: strategy.avoid_low_volume || false,
        is_active: true,
        last_execution: new Date().toISOString()
      };

      const { data: session, error } = await supabase
        .from('trading_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create trading session:', error);
        throw error;
      }

      console.log('✅ Trading session created:', session);

      // Log the session start
      await this.logTradingActivity(session.id, userId, 'info', 
        `Server-side trading started for ${strategy.strategy_name} on ${strategy.symbol}`
      );

      return session as TradingSessionRecord;

    } catch (error) {
      console.error('❌ Failed to start server-side forward testing:', error);
      throw error;
    }
  }

  static async stopServerSideForwardTesting(userId: string, sessionId?: string): Promise<void> {
    try {
      console.log('⏹️ Stopping server-side forward testing for user:', userId);
      
      let query = supabase
        .from('trading_sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (sessionId) {
        query = query.eq('id', sessionId);
      }

      const { error } = await query;

      if (error) {
        console.error('❌ Failed to stop trading session:', error);
        throw error;
      }

      // Log the session stop
      if (sessionId) {
        await this.logTradingActivity(sessionId, userId, 'info', 
          'Server-side trading stopped by user'
        );
      }

      console.log('✅ Server-side forward testing stopped');

    } catch (error) {
      console.error('❌ Failed to stop server-side forward testing:', error);
      throw error;
    }
  }

  static async stopExistingUserSessions(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trading_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('⚠️ Failed to stop existing sessions:', error);
      } else {
        console.log('✅ Stopped existing active sessions for user');
      }
    } catch (error) {
      console.error('⚠️ Error stopping existing sessions:', error);
    }
  }

  static async getActiveSessions(): Promise<TradingSessionRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get active sessions:', error);
        return [];
      }

      console.log(`📊 Found ${data?.length || 0} active trading sessions`);
      return (data || []) as TradingSessionRecord[];
    } catch (error) {
      console.error('❌ Failed to get active sessions:', error);
      return [];
    }
  }

  static async getAllUserSessions(): Promise<TradingSessionRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Failed to get user sessions:', error);
        return [];
      }

      return (data || []) as TradingSessionRecord[];
    } catch (error) {
      console.error('❌ Failed to get user sessions:', error);
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

      const logs = (data || []).map(log => ({
        ...log,
        log_type: log.log_type as 'trade' | 'error' | 'info'
      })) as TradingLog[];

      return logs;
    } catch (error) {
      console.error('❌ Failed to get trading logs:', error);
      return [];
    }
  }

  static async logTradingActivity(
    sessionId: string, 
    userId: string, 
    logType: 'trade' | 'error' | 'info', 
    message: string, 
    tradeData?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('trading_logs')
        .insert([{
          session_id: sessionId,
          user_id: userId,
          log_type: logType,
          message,
          trade_data: tradeData
        }]);

      if (error) {
        console.error('⚠️ Failed to log trading activity:', error);
      }
    } catch (error) {
      console.error('⚠️ Error logging trading activity:', error);
    }
  }

  static async testServerSideConnection(): Promise<boolean> {
    try {
      console.log('🔧 Testing server-side connection...');
      
      // Test database connectivity
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        return false;
      }

      // Test if we can read sessions
      const sessions = await this.getActiveSessions();
      console.log(`✅ Server-side test successful - found ${sessions.length} active sessions`);
      
      return true;
    } catch (error) {
      console.error('❌ Server-side test error:', error);
      return false;
    }
  }

  static async getSessionStatus(sessionId: string): Promise<TradingSessionRecord | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Failed to get session status:', error);
        return null;
      }

      return data as TradingSessionRecord;
    } catch (error) {
      console.error('❌ Failed to get session status:', error);
      return null;
    }
  }
}
