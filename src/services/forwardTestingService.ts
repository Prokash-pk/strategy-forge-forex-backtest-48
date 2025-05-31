
import { supabase } from '@/integrations/supabase/client';

export interface ForwardTestingConfig {
  strategyId: string;
  oandaAccountId: string;
  oandaApiKey: string;
  environment: 'practice' | 'live';
  enabled: boolean;
}

export class ForwardTestingService {
  private static instance: ForwardTestingService;
  private isRunning = false;
  private intervalId?: number;
  private config?: ForwardTestingConfig;

  static getInstance(): ForwardTestingService {
    if (!ForwardTestingService.instance) {
      ForwardTestingService.instance = new ForwardTestingService();
    }
    return ForwardTestingService.instance;
  }

  async startForwardTesting(config: ForwardTestingConfig, strategy: any) {
    this.config = config;
    this.isRunning = true;

    console.log('Starting forward testing for strategy:', strategy.name);

    // Run strategy every minute (adjust as needed)
    this.intervalId = window.setInterval(async () => {
      await this.executeStrategy(strategy);
    }, 60000); // 1 minute

    // Execute immediately
    await this.executeStrategy(strategy);
  }

  stopForwardTesting() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Forward testing stopped');
  }

  private async executeStrategy(strategy: any) {
    if (!this.isRunning || !this.config) return;

    try {
      // Fetch latest market data
      const marketData = await this.fetchMarketData(strategy.symbol);
      
      // Execute strategy logic (simplified - you'd need to implement the full Python execution)
      const signals = await this.executeStrategyLogic(strategy, marketData);

      // Process signals and execute trades
      for (const signal of signals) {
        await this.executeTrade(signal);
      }

    } catch (error) {
      console.error('Forward testing execution error:', error);
    }
  }

  private async fetchMarketData(symbol: string) {
    // Fetch latest market data from your data source
    // This is a simplified version - you'd integrate with your market data service
    const response = await fetch(`/api/market-data/${symbol}`);
    return await response.json();
  }

  private async executeStrategyLogic(strategy: any, marketData: any) {
    // Execute the Python strategy logic
    // This would use your Python execution service
    // Return array of trading signals
    return [];
  }

  private async executeTrade(signal: any) {
    if (!this.config) return;

    try {
      const { data, error } = await supabase.functions.invoke('oanda-trade-executor', {
        body: {
          signal: {
            action: signal.action,
            symbol: signal.symbol,
            units: signal.units,
            stopLoss: signal.stopLoss,
            takeProfit: signal.takeProfit,
            strategyId: this.config.strategyId,
            userId: 'current-user-id' // Get from auth
          },
          config: {
            accountId: this.config.oandaAccountId,
            apiKey: this.config.oandaApiKey,
            environment: this.config.environment
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log('Trade executed:', data);
      
    } catch (error) {
      console.error('Trade execution error:', error);
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
