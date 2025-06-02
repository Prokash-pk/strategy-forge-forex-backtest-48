import { supabase } from '@/integrations/supabase/client';
import { StrategyExecutor } from '@/utils/strategyExecutor';

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
  private intervalId?: number;
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
    this.isRunning = true;

    // Load the selected strategy settings from localStorage
    const savedStrategySettings = localStorage.getItem('selected_strategy_settings');
    if (savedStrategySettings) {
      this.strategySettings = JSON.parse(savedStrategySettings);
      console.log('Using strategy settings:', this.strategySettings?.strategy_name);
    } else {
      console.log('No strategy settings found, using default strategy');
    }

    console.log('Starting forward testing for strategy:', this.strategySettings?.strategy_name || strategy.name);

    // Run strategy every minute (adjust as needed)
    this.intervalId = window.setInterval(async () => {
      await this.executeStrategy();
    }, 60000); // 1 minute

    // Execute immediately
    await this.executeStrategy();
  }

  stopForwardTesting() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Forward testing stopped');
  }

  private async executeStrategy() {
    if (!this.isRunning || !this.config) return;

    try {
      const strategyToUse = this.strategySettings || {
        name: 'Default Strategy',
        symbol: 'EURUSD=X',
        code: 'Smart Momentum Strategy'
      };

      // Use mock data for demo purposes since the API endpoint doesn't exist
      const marketData = this.generateMockMarketData();
      
      // Execute strategy logic using the saved strategy settings
      const signals = await this.executeStrategyLogic(strategyToUse, marketData);

      // Process signals and execute trades
      for (const signal of signals) {
        await this.executeTrade(signal);
      }

    } catch (error) {
      console.error('Forward testing execution error:', error);
    }
  }

  private async fetchMarketData(symbol: string) {
    // For demo purposes, always use mock data
    // In production, this would connect to a real market data feed
    return this.generateMockMarketData();
  }

  private generateMockMarketData() {
    const length = 100;
    const basePrice = 1.1000;
    const data = {
      open: [],
      high: [],
      low: [],
      close: [],
      volume: [],
      Open: [],
      High: [],
      Low: [],
      Close: [],
      Volume: []
    };

    for (let i = 0; i < length; i++) {
      const price = basePrice + (Math.random() - 0.5) * 0.01;
      const high = price + Math.random() * 0.002;
      const low = price - Math.random() * 0.002;
      const close = price + (Math.random() - 0.5) * 0.001;
      const volume = Math.random() * 1000000;
      
      // Both lowercase and uppercase for compatibility
      data.open.push(price);
      data.high.push(high);
      data.low.push(low);
      data.close.push(close);
      data.volume.push(volume);
      
      data.Open.push(price);
      data.High.push(high);
      data.Low.push(low);
      data.Close.push(close);
      data.Volume.push(volume);
    }

    return data;
  }

  private async executeStrategyLogic(strategy: any, marketData: any) {
    try {
      // Use the StrategyExecutor to run the strategy code
      const strategyCode = strategy.strategy_code || strategy.code || 'Smart Momentum Strategy';
      const signals = StrategyExecutor.executeStrategy(strategyCode, marketData);

      // Convert strategy signals to trading signals
      const tradingSignals = [];
      
      if (signals.entry && signals.entry.length > 0) {
        const lastIndex = signals.entry.length - 1;
        
        if (signals.entry[lastIndex]) {
          // Calculate position size based on strategy settings
          const positionSize = this.calculatePositionSize();
          
          // Apply reverse signals if configured
          const shouldReverse = this.strategySettings?.reverse_signals || false;
          
          tradingSignals.push({
            action: shouldReverse ? 'sell' : 'buy',
            symbol: strategy.symbol || 'EUR_USD',
            units: positionSize,
            stopLoss: this.strategySettings?.stop_loss || 40,
            takeProfit: this.strategySettings?.take_profit || 80,
            strategyId: this.config?.strategyId,
            timestamp: new Date().toISOString()
          });
        }
      }

      return tradingSignals;
    } catch (error) {
      console.error('Strategy execution error:', error);
      return [];
    }
  }

  private calculatePositionSize(): number {
    if (!this.strategySettings) return 1000; // Default size

    const accountBalance = this.strategySettings.initial_balance || 10000;
    const riskPerTrade = this.strategySettings.risk_per_trade || 1;
    const stopLossPips = this.strategySettings.stop_loss || 40;
    
    // Simple position sizing calculation
    const riskAmount = (accountBalance * riskPerTrade) / 100;
    const pipValue = 1; // Simplified pip value
    const positionSize = Math.floor(riskAmount / (stopLossPips * pipValue));
    
    // Ensure position size doesn't exceed max
    const maxPosition = this.strategySettings.max_position_size || 100000;
    return Math.min(positionSize, maxPosition);
  }

  private async executeTrade(signal: any) {
    if (!this.config) return;

    try {
      console.log('Executing trade signal:', signal);

      // In a real implementation, this would call the OANDA trade executor
      // For now, we'll just log the trade and store it
      const tradeLog = {
        timestamp: signal.timestamp,
        action: signal.action,
        symbol: signal.symbol,
        units: signal.units,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        strategyName: this.strategySettings?.strategy_name || 'Default Strategy',
        environment: this.config.environment,
        status: 'executed'
      };

      console.log('Trade executed:', tradeLog);

      // Store trade log in localStorage for demo purposes
      const existingLogs = JSON.parse(localStorage.getItem('forward_testing_trades') || '[]');
      existingLogs.push(tradeLog);
      
      // Keep only the last 100 trades to prevent storage from growing too large
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem('forward_testing_trades', JSON.stringify(existingLogs));
      
    } catch (error) {
      console.error('Trade execution error:', error);
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getCurrentStrategy(): StrategySettings | null {
    return this.strategySettings || null;
  }
}
