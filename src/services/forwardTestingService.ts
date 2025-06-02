
import { supabase } from '@/integrations/supabase/client';
import { ServerForwardTestingService, ServerTradingSession } from './serverForwardTestingService';

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
  private isRunning = false;
  private config?: ForwardTestingConfig;
  private strategySettings?: StrategySettings;
  private useServerSide = true; // New flag to use server-side execution

  static getInstance(): ForwardTestingService {
    if (!ForwardTestingService.instance) {
      ForwardTestingService.instance = new ForwardTestingService();
    }
    return ForwardTestingService.instance;
  }

  async startForwardTesting(config: ForwardTestingConfig, strategy: any) {
    this.config = config;
    this.isRunning = true;

    // Load the selected strategy settings from localStorage
    const savedStrategySettings = localStorage.getItem('selected_strategy_settings');
    if (savedStrategySettings) {
      this.strategySettings = JSON.parse(savedStrategySettings);
      console.log('Using strategy settings:', this.strategySettings?.strategy_name);
    } else {
      console.log('No strategy settings found, using default strategy');
    }

    if (this.useServerSide && this.strategySettings) {
      // Use server-side execution
      console.log('Starting SERVER-SIDE forward testing for strategy:', this.strategySettings.strategy_name);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

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
        
      } catch (error) {
        console.error('Failed to start server-side forward testing:', error);
        this.isRunning = false;
        throw error;
      }
    } else {
      // Fall back to client-side execution (original implementation)
      console.log('Starting CLIENT-SIDE forward testing for strategy:', this.strategySettings?.strategy_name || strategy.name);
      console.log('⚠️ Note: This will only run when the browser is open');
      
      // Original client-side implementation would go here...
      // For now, we'll just log that it's not implemented
      console.log('Client-side execution not implemented in this version');
    }
  }

  async stopForwardTesting() {
    this.isRunning = false;

    if (this.useServerSide && this.strategySettings && this.config) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        await ServerForwardTestingService.stopServerSideForwardTesting(
          user.id, 
          this.strategySettings.id
        );
        console.log('✅ Server-side forward testing stopped successfully');
        
      } catch (error) {
        console.error('Failed to stop server-side forward testing:', error);
      }
    }
    
    console.log('Forward testing stopped');
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getCurrentStrategy(): StrategySettings | null {
    return this.strategySettings || null;
  }

  // Get trading statistics from server-side logs
  async getForwardTestingStats() {
    if (this.useServerSide) {
      try {
        const logs = await ServerForwardTestingService.getTradingLogs();
        const tradeLogs = logs.filter(log => log.log_type === 'trade');
        const errorLogs = logs.filter(log => log.log_type === 'error');

        return {
          totalTrades: tradeLogs.length,
          successfulTrades: tradeLogs.filter(log => log.trade_data?.success).length,
          failedTrades: tradeLogs.filter(log => !log.trade_data?.success).length,
          totalErrors: errorLogs.length,
          lastExecution: tradeLogs.length > 0 ? tradeLogs[0].timestamp : null,
          isUsingServerSide: true
        };
      } catch (error) {
        console.error('Failed to get server-side stats:', error);
      }
    }

    // Fallback to client-side stats
    const trades = JSON.parse(localStorage.getItem('forward_testing_trades') || '[]');
    const errors = JSON.parse(localStorage.getItem('forward_testing_errors') || '[]');
    
    return {
      totalTrades: trades.length,
      successfulTrades: trades.filter((t: any) => t.status === 'executed').length,
      failedTrades: trades.filter((t: any) => t.status === 'failed').length,
      totalErrors: errors.length,
      lastExecution: trades.length > 0 ? trades[trades.length - 1].timestamp : null,
      isUsingServerSide: false
    };
  }

  // Check if there are active server-side sessions
  async hasActiveServerSessions(): Promise<boolean> {
    if (!this.useServerSide) return false;
    
    try {
      const sessions = await ServerForwardTestingService.getActiveSessions();
      return sessions.length > 0;
    } catch (error) {
      console.error('Failed to check active sessions:', error);
      return false;
    }
  }
}
