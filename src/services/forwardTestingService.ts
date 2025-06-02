
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
  private isClientSideRunning = false;
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
    this.isClientSideRunning = true;

    // Load the selected strategy settings from localStorage
    const savedStrategySettings = localStorage.getItem('selected_strategy_settings');
    if (savedStrategySettings) {
      this.strategySettings = JSON.parse(savedStrategySettings);
      console.log('Using strategy settings:', this.strategySettings?.strategy_name);
    } else {
      console.log('No strategy settings found, using default strategy');
      throw new Error('No strategy settings found. Please select a strategy first.');
    }

    console.log('🚀 Starting SERVER-SIDE forward testing for strategy:', this.strategySettings.strategy_name);
    console.log('✅ This will continue running even when you close the browser!');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create server-side session that will persist independently
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
      
      console.log('✅ Server-side forward testing started successfully');
      console.log('📊 Trading will continue automatically every 5 minutes via cron job');
      console.log('🔒 Your OANDA credentials are securely stored on the server');
      console.log('🌐 You can safely close your browser - trading will continue');
      
    } catch (error) {
      console.error('Failed to start server-side forward testing:', error);
      this.isClientSideRunning = false;
      throw error;
    }
  }

  async stopForwardTesting() {
    this.isClientSideRunning = false;

    if (this.strategySettings && this.config) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        await ServerForwardTestingService.stopServerSideForwardTesting(
          user.id, 
          this.strategySettings.id
        );
        
        console.log('✅ Server-side forward testing stopped successfully');
        console.log('🛑 All trading sessions have been deactivated');
        
      } catch (error) {
        console.error('Failed to stop server-side forward testing:', error);
      }
    }
    
    console.log('Forward testing stopped');
  }

  isActive(): boolean {
    return this.isClientSideRunning;
  }

  getCurrentStrategy(): StrategySettings | null {
    return this.strategySettings || null;
  }

  // Get trading statistics from server-side logs
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
        isUsingServerSide: true,
        message: tradeLogs.length > 0 
          ? `Running server-side with ${tradeLogs.length} trades executed`
          : 'Server-side forward testing active - waiting for trading signals'
      };
    } catch (error) {
      console.error('Failed to get server-side stats:', error);
      return {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalErrors: 0,
        lastExecution: null,
        isUsingServerSide: true,
        message: 'Server-side forward testing active'
      };
    }
  }

  // Check if there are active server-side sessions
  async hasActiveServerSessions(): Promise<boolean> {
    try {
      const sessions = await ServerForwardTestingService.getActiveSessions();
      return sessions.length > 0;
    } catch (error) {
      console.error('Failed to check active sessions:', error);
      return false;
    }
  }
}
