
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
  private static activeRequests = new Map<string, AbortController>();

  static async startServerSideForwardTesting(
    strategy: any,
    config: any,
    userId: string
  ): Promise<TradingSessionRecord> {
    console.log('🚀 STARTING SERVER-SIDE TRADING...');
    console.log('📊 Strategy:', strategy?.strategy_name);
    console.log('🔧 Config:', { environment: config?.environment, accountId: config?.accountId });
    console.log('👤 User ID:', userId);

    // Basic validation first
    if (!strategy || !config || !userId) {
      console.error('❌ Missing required parameters');
      throw new Error('Missing required parameters for server-side trading');
    }

    if (!strategy.strategy_name || !strategy.symbol || !strategy.timeframe) {
      console.error('❌ Strategy missing required fields');
      throw new Error('Strategy is missing required fields (name, symbol, timeframe)');
    }

    if (!config.accountId || !config.apiKey) {
      console.error('❌ OANDA config missing credentials');
      throw new Error('OANDA configuration is missing account ID or API key');
    }

    try {
      // Quick existing session check - much simpler query
      console.log('🔍 Quick check for existing sessions...');
      const { count, error: countError } = await supabase
        .from('trading_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('strategy_name', strategy.strategy_name)
        .eq('is_active', true);

      if (countError) {
        console.error('❌ Error checking existing sessions:', countError);
        throw new Error('Database error checking existing sessions');
      }

      if (count && count > 0) {
        console.log('⚠️ Found existing active session');
        throw new Error('A trading session already exists for this strategy');
      }

      // Create session data
      const sessionData = {
        user_id: userId,
        strategy_id: strategy.id || crypto.randomUUID(),
        strategy_name: strategy.strategy_name,
        strategy_code: strategy.strategy_code || '',
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
        reverse_signals: strategy.reverse_signals || false,
        avoid_low_volume: false
      };

      console.log('📝 Creating session with data:', {
        strategy_name: sessionData.strategy_name,
        symbol: sessionData.symbol,
        environment: sessionData.environment,
        user_id: sessionData.user_id
      });

      // Insert session
      const { data: session, error } = await supabase
        .from('trading_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error creating session:', error);
        
        if (error.code === '23505') {
          throw new Error('A trading session already exists for this strategy');
        } else if (error.code === '23503') {
          throw new Error('Invalid user or strategy reference');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      if (!session) {
        console.error('❌ No session data returned');
        throw new Error('Session created but no data returned');
      }

      console.log('✅ ✅ ✅ SERVER-SIDE TRADING SESSION CREATED SUCCESSFULLY! ✅ ✅ ✅');
      console.log('🆔 Session ID:', session.id);
      console.log('📊 Strategy:', session.strategy_name);
      console.log('💱 Symbol:', session.symbol);
      console.log('🌍 Environment:', session.environment);
      
      return session as TradingSessionRecord;

    } catch (error) {
      console.error('❌ FAILED TO START SERVER-SIDE TRADING:', error);
      throw error;
    }
  }

  static async stopServerSideForwardTesting(userId: string): Promise<void> {
    try {
      console.log('⏹️ Stopping server-side trading for user:', userId);
      
      if (!userId) {
        throw new Error('User ID is required to stop trading sessions');
      }

      const { error } = await supabase
        .from('trading_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Failed to stop sessions:', error);
        throw new Error(`Failed to stop sessions: ${error.message}`);
      }

      console.log('✅ Server-side trading sessions stopped successfully');

    } catch (error) {
      console.error('❌ Failed to stop server-side trading:', error);
      throw error;
    }
  }

  static async getActiveSessions(): Promise<TradingSessionRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ No authenticated user found');
        return [];
      }

      console.log('📊 Fetching active sessions for user:', user.id);

      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get active sessions:', error);
        throw new Error(`Failed to fetch sessions: ${error.message}`);
      }

      const sessions = (data || []) as TradingSessionRecord[];
      console.log(`📊 Found ${sessions.length} active server-side trading sessions`);
      
      return sessions;
    } catch (error) {
      console.error('❌ Failed to get active sessions:', error);
      return [];
    }
  }

  static async getTradingLogs(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ No authenticated user found');
        return [];
      }

      const { data, error } = await supabase
        .from('trading_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Failed to get trading logs:', error);
        return [];
      }

      console.log(`📊 Found ${data?.length || 0} trading logs`);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to get trading logs:', error);
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

  static cancelAllRequests(): void {
    console.log('🚫 Cancelling all active requests...');
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
  }
}
