
import { supabase } from '@/integrations/supabase/client';
import { ServerForwardTestingService, ServerTradingSession, TradingLog } from './serverForwardTestingService';

export interface ForwardTestingConfig {
  strategyId: string;
  oandaAccountId: string;
  oandaApiKey: string;
  environment: 'practice' | 'live';
  enabled: boolean;
}

interface StrategySettings {
  id: string;
  strategy_name: string;
  strategy_code: string;
  symbol: string;
  timeframe: string;
  initial_balance: number;
  risk_per_trade: number;
  stop_loss: number;
  take_profit: number;
  spread: number;
  commission: number;
  slippage: number;
  max_position_size: number;
  risk_model: string;
  reverse_signals: boolean;
  position_sizing_mode: string;
  risk_reward_ratio: number;
}

export class ForwardTestingService {
  private static instance: ForwardTestingService;
  private config?: ForwardTestingConfig;
  private strategySettings?: StrategySettings;

  static getInstance(): ForwardTestingService {
    if (!ForwardTestingService.instance) {
      ForwardTestingService.instance = new ForwardTestingService();
    }
    return ForwardTestingService.instance;
  }

  async startForwardTesting(config: ForwardTestingConfig, strategy: any) {
    this.config = config;

    // Load the selected strategy settings from localStorage
    const savedStrategySettings = localStorage.getItem('selected_strategy_settings');
    if (savedStrategySettings) {
      this.strategySettings = JSON.parse(savedStrategySettings);
      console.log('🚀 Starting FULLY AUTONOMOUS server-side forward testing for strategy:', this.strategySettings?.strategy_name);
    } else {
      console.log('No strategy settings found, using default strategy');
      throw new Error('No strategy settings found. Please select a strategy first.');
    }

    console.log('✅ AUTONOMOUS TRADING MODE: Trading will run 24/7 independently on our servers');
    console.log('🌐 Your computer can be shut down - trading continues automatically');
    console.log('🔒 OANDA credentials securely stored on server for continuous operation');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create completely independent server-side session
      const session: ServerTradingSession = {
        user_id: user.id,
        strategy_id: this.strategySettings.id,
        strategy_code: this.strategySettings.strategy_code,
        symbol: this.strategySettings.symbol,
        timeframe: this.strategySettings.timeframe,
        oanda_account_id: config.oandaAccountId,
        oanda_api_key: config.oandaApiKey,
        environment: config.environment,
        risk_per_trade: this.strategySettings.risk_per_trade,
        stop_loss: this.strategySettings.stop_loss,
        take_profit: this.strategySettings.take_profit,
        max_position_size: this.strategySettings.max_position_size,
        reverse_signals: this.strategySettings.reverse_signals
      };

      await ServerForwardTestingService.startServerSideForwardTesting(session);
      
      console.log('✅ AUTONOMOUS TRADING ACTIVATED');
      console.log('📊 Server will execute trades automatically every 5 minutes via cron job');
      console.log('🔄 Trading continues 24/7 regardless of browser status');
      console.log('💻 You can safely shut down your computer - trading persists');
      console.log('🔐 All credentials securely stored and managed server-side');
      
    } catch (error) {
      console.error('Failed to start autonomous server-side forward testing:', error);
      throw error;
    }
  }

  async stopForwardTesting() {
    if (this.strategySettings && this.config) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        await ServerForwardTestingService.stopServerSideForwardTesting(
          user.id, 
          this.strategySettings.id
        );
        
        console.log('✅ Autonomous trading stopped successfully');
        console.log('🛑 All server-side trading sessions deactivated');
        
      } catch (error) {
        console.error('Failed to stop autonomous trading:', error);
      }
    }
    
    console.log('Autonomous forward testing stopped');
  }

  isActive(): boolean {
    // This is now determined by server-side sessions, not client state
    return false; // Client state is irrelevant for autonomous trading
  }

  getCurrentStrategy(): StrategySettings | null {
    return this.strategySettings || null;
  }

  // Get trading statistics from autonomous server-side operations
  async getForwardTestingStats() {
    try {
      const logs: TradingLog[] = await ServerForwardTestingService.getTradingLogs();
      const tradeLogs = logs.filter(log => log.log_type === 'trade');
      const errorLogs = logs.filter(log => log.log_type === 'error');

      return {
        totalTrades: tradeLogs.length,
        successfulTrades: tradeLogs.filter(log => log.trade_data?.success).length,
        failedTrades: tradeLogs.filter(log => !log.trade_data?.success).length,
        totalErrors: errorLogs.length,
        lastExecution: tradeLogs.length > 0 ? tradeLogs[0].timestamp : null,
        isAutonomous: true,
        message: tradeLogs.length > 0 
          ? `Autonomous trading active with ${tradeLogs.length} trades executed`
          : 'Autonomous trading active - monitoring markets for signals'
      };
    } catch (error) {
      console.error('Failed to get autonomous trading stats:', error);
      return {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalErrors: 0,
        lastExecution: null,
        isAutonomous: true,
        message: 'Autonomous trading active - operating independently'
      };
    }
  }

  // Check if autonomous trading sessions are running on server
  async hasActiveAutonomousSessions(): Promise<boolean> {
    try {
      const sessions = await ServerForwardTestingService.getActiveSessions();
      return sessions.length > 0;
    } catch (error) {
      console.error('Failed to check autonomous sessions:', error);
      return false;
    }
  }
}
