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
      console.log('📊 Strategy:', strategy?.strategy_name);
      console.log('🔧 Config environment:', config?.environment);
      console.log('👤 User ID:', userId);
      
      if (!strategy || !config || !userId) {
        throw new Error('Missing required parameters for server-side trading');
      }

      if (!strategy.strategy_name || !strategy.symbol || !strategy.timeframe) {
        throw new Error('Strategy is missing required fields (name, symbol, timeframe)');
      }

      if (!config.accountId || !config.apiKey) {
        throw new Error('OANDA configuration is missing account ID or API key');
      }

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
        environment: sessionData.environment
      });

      // Add timeout protection to the database operation
      const insertPromise = supabase
        .from('trading_sessions')
        .insert([sessionData])
        .select()
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timeout after 15 seconds')), 15000);
      });

      const { data: session, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Supabase error creating session:', error);
        
        // Provide more specific error messages
        if (error.code === '23505') {
          throw new Error('A trading session already exists for this strategy');
        } else if (error.code === '23503') {
          throw new Error('Invalid user or strategy reference');
        } else if (error.message?.includes('permission')) {
          throw new Error('Database permission denied - please check your authentication');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      if (!session) {
        throw new Error('Session created but no data returned');
      }

      console.log('✅ Server-side trading session created successfully:', session.id);
      return session as TradingSessionRecord;

    } catch (error) {
      console.error('❌ Failed to start server-side forward testing:', error);
      
      // Handle timeout errors specifically
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      throw error;
    }
  }

  static async stopServerSideForwardTesting(userId: string): Promise<void> {
    try {
      console.log('⏹️ Stopping server-side forward testing for user:', userId);
      
      if (!userId) {
        throw new Error('User ID is required to stop trading sessions');
      }

      // Add timeout protection
      const updatePromise = supabase
        .from('trading_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Stop operation timeout after 10 seconds')), 10000);
      });

      const { error } = await Promise.race([updatePromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Failed to stop server-side trading sessions:', error);
        throw new Error(`Failed to stop sessions: ${error.message}`);
      }

      console.log('✅ Server-side trading sessions stopped successfully');

    } catch (error) {
      console.error('❌ Failed to stop server-side trading:', error);
      
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Stop request timed out. Please try again.');
      }
      
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
        console.error('❌ Failed to get active server sessions:', error);
        throw new Error(`Failed to fetch sessions: ${error.message}`);
      }

      const sessions = (data || []) as TradingSessionRecord[];
      console.log(`📊 Found ${sessions.length} active server-side trading sessions`);
      
      return sessions;
    } catch (error) {
      console.error('❌ Failed to get active server sessions:', error);
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
}
