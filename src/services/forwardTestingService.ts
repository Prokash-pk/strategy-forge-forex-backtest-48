
import { supabase } from '@/integrations/supabase/client';
import { StrategyExecutor } from '@/utils/strategyExecutor';
import { OANDAMarketDataService } from './oandaMarketDataService';

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

    console.log('Starting LIVE forward testing for strategy:', this.strategySettings?.strategy_name || strategy.name);
    console.log('Using OANDA live data from:', config.environment, 'account');

    // Run strategy every 30 seconds for more responsive testing
    this.intervalId = window.setInterval(async () => {
      await this.executeStrategy();
    }, 30000); // 30 seconds

    // Execute immediately
    await this.executeStrategy();
  }

  stopForwardTesting() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Live forward testing stopped');
  }

  private async executeStrategy() {
    if (!this.isRunning || !this.config || !this.strategySettings) return;

    try {
      console.log('Executing strategy with live OANDA data...');

      // Convert symbol to OANDA format
      const oandaSymbol = OANDAMarketDataService.convertSymbolToOANDA(this.strategySettings.symbol);
      
      // Fetch live market data from OANDA
      const marketData = await this.fetchLiveMarketData(oandaSymbol);
      
      if (!marketData || marketData.close.length === 0) {
        console.warn('No market data received, skipping execution');
        return;
      }

      // Execute strategy logic using live data
      const signals = await this.executeStrategyLogic(this.strategySettings, marketData);

      // Process signals and execute trades
      for (const signal of signals) {
        await this.executeTrade(signal);
      }

    } catch (error) {
      console.error('Live forward testing execution error:', error);
      
      // Store error log
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        strategy: this.strategySettings?.strategy_name || 'Unknown',
        type: 'execution_error'
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('forward_testing_errors') || '[]');
      existingLogs.push(errorLog);
      localStorage.setItem('forward_testing_errors', JSON.stringify(existingLogs.slice(-50))); // Keep last 50 errors
    }
  }

  private async fetchLiveMarketData(symbol: string) {
    if (!this.config) return null;

    try {
      // Map timeframe to OANDA granularity
      const timeframeMap: Record<string, string> = {
        '1m': 'M1',
        '5m': 'M5',
        '15m': 'M15',
        '30m': 'M30',
        '1h': 'H1',
        '4h': 'H4',
        '1d': 'D',
        'daily': 'D'
      };

      const granularity = timeframeMap[this.strategySettings?.timeframe || '1h'] || 'H1';
      
      return await OANDAMarketDataService.fetchLiveMarketData(
        this.config.oandaAccountId,
        this.config.oandaApiKey,
        this.config.environment,
        symbol,
        granularity,
        100 // Last 100 candles for analysis
      );
    } catch (error) {
      console.error('Failed to fetch live market data:', error);
      throw error;
    }
  }

  private async executeStrategyLogic(strategy: StrategySettings, marketData: any) {
    try {
      // Use the StrategyExecutor to run the strategy code with live data
      const strategyCode = strategy.strategy_code || 'Smart Momentum Strategy';
      const signals = StrategyExecutor.executeStrategy(strategyCode, marketData);

      // Convert strategy signals to trading signals
      const tradingSignals = [];
      
      if (signals.entry && signals.entry.length > 0) {
        const lastIndex = signals.entry.length - 1;
        
        // Check if we have a new signal (last entry is true)
        if (signals.entry[lastIndex]) {
          // Calculate position size based on strategy settings
          const positionSize = this.calculatePositionSize();
          
          // Apply reverse signals if configured
          const shouldReverse = strategy.reverse_signals || false;
          
          // Use current market price for stop loss and take profit calculations
          const currentPrice = marketData.close[marketData.close.length - 1];
          const stopLossPips = strategy.stop_loss || 40;
          const takeProfitPips = strategy.take_profit || 80;
          
          // Calculate stop loss and take profit prices
          const pipValue = 0.0001; // For most major pairs
          const stopLossPrice = shouldReverse ? 
            (currentPrice + (stopLossPips * pipValue)).toFixed(5) :
            (currentPrice - (stopLossPips * pipValue)).toFixed(5);
          const takeProfitPrice = shouldReverse ?
            (currentPrice - (takeProfitPips * pipValue)).toFixed(5) :
            (currentPrice + (takeProfitPips * pipValue)).toFixed(5);

          tradingSignals.push({
            action: shouldReverse ? 'SELL' : 'BUY',
            symbol: OANDAMarketDataService.convertSymbolToOANDA(strategy.symbol),
            units: positionSize,
            stopLoss: stopLossPrice,
            takeProfit: takeProfitPrice,
            strategyId: this.config?.strategyId,
            timestamp: new Date().toISOString(),
            currentPrice: currentPrice
          });

          console.log('Generated trading signal:', tradingSignals[0]);
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
    return Math.min(Math.max(positionSize, 100), maxPosition); // Minimum 100 units
  }

  private async executeTrade(signal: any) {
    if (!this.config) return;

    try {
      console.log('Executing LIVE trade signal:', signal);

      // Call the OANDA trade executor for real execution
      const response = await supabase.functions.invoke('oanda-trade-executor', {
        body: {
          signal: {
            action: signal.action,
            symbol: signal.symbol,
            units: signal.units,
            stopLoss: signal.stopLoss,
            takeProfit: signal.takeProfit,
            strategyId: signal.strategyId,
            userId: 'forward-testing'
          },
          config: {
            accountId: this.config.oandaAccountId,
            apiKey: this.config.oandaApiKey,
            environment: this.config.environment
          },
          testMode: false
        }
      });

      console.log('OANDA trade response:', response);

      const tradeLog = {
        timestamp: signal.timestamp,
        action: signal.action,
        symbol: signal.symbol,
        units: signal.units,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        currentPrice: signal.currentPrice,
        strategyName: this.strategySettings?.strategy_name || 'Unknown Strategy',
        environment: this.config.environment,
        status: response.error ? 'failed' : 'executed',
        response: response.data || response.error,
        executionType: 'live_forward_testing'
      };

      console.log('Live trade executed:', tradeLog);

      // Store trade log in localStorage
      const existingLogs = JSON.parse(localStorage.getItem('forward_testing_trades') || '[]');
      existingLogs.push(tradeLog);
      
      // Keep only the last 100 trades to prevent storage from growing too large
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem('forward_testing_trades', JSON.stringify(existingLogs));
      
    } catch (error) {
      console.error('Live trade execution error:', error);
      
      // Log the failed trade
      const failedTradeLog = {
        timestamp: signal.timestamp,
        action: signal.action,
        symbol: signal.symbol,
        units: signal.units,
        error: error instanceof Error ? error.message : 'Unknown error',
        strategyName: this.strategySettings?.strategy_name || 'Unknown Strategy',
        status: 'failed',
        executionType: 'live_forward_testing'
      };

      const existingLogs = JSON.parse(localStorage.getItem('forward_testing_trades') || '[]');
      existingLogs.push(failedTradeLog);
      localStorage.setItem('forward_testing_trades', JSON.stringify(existingLogs.slice(-100)));
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getCurrentStrategy(): StrategySettings | null {
    return this.strategySettings || null;
  }

  // Get live trading statistics
  getForwardTestingStats() {
    const trades = JSON.parse(localStorage.getItem('forward_testing_trades') || '[]');
    const errors = JSON.parse(localStorage.getItem('forward_testing_errors') || '[]');
    
    return {
      totalTrades: trades.length,
      successfulTrades: trades.filter((t: any) => t.status === 'executed').length,
      failedTrades: trades.filter((t: any) => t.status === 'failed').length,
      totalErrors: errors.length,
      lastExecution: trades.length > 0 ? trades[trades.length - 1].timestamp : null,
      isUseLiveData: true
    };
  }
}
