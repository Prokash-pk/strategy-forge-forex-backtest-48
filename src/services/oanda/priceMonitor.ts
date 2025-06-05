
import { OANDAMarketDataService } from '../oandaMarketDataService';
import { PythonExecutor } from '../pythonExecutor';
import { OANDAConfig, StrategySettings } from '@/types/oanda';

export interface PriceMonitorResult {
  timestamp: string;
  symbol: string;
  currentPrice: number;
  signalGenerated: boolean;
  signalType: 'BUY' | 'SELL' | null;
  confidence: number;
  marketData: any;
}

export class OANDAPriceMonitor {
  private static instance: OANDAPriceMonitor;
  private monitorInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private onSignalCallback: ((result: PriceMonitorResult) => void) | null = null;

  static getInstance(): OANDAPriceMonitor {
    if (!OANDAPriceMonitor.instance) {
      OANDAPriceMonitor.instance = new OANDAPriceMonitor();
    }
    return OANDAPriceMonitor.instance;
  }

  async startMonitoring(
    config: OANDAConfig,
    strategy: StrategySettings,
    onSignal?: (result: PriceMonitorResult) => void
  ) {
    if (this.isMonitoring) {
      console.log('📊 Price monitor already running');
      return;
    }

    this.isMonitoring = true;
    this.onSignalCallback = onSignal || null;
    
    console.log(`🔍 Starting OANDA price monitor for ${strategy.symbol}`);
    console.log(`⏰ Checking every 60 seconds for signal matches`);

    // Initial check
    await this.checkPriceAction(config, strategy);

    // Set up periodic monitoring (every 60 seconds)
    this.monitorInterval = setInterval(async () => {
      if (this.isMonitoring) {
        await this.checkPriceAction(config, strategy);
      }
    }, 60000); // 60 seconds

    console.log('✅ OANDA price monitor started successfully');
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    this.onSignalCallback = null;
    console.log('🛑 OANDA price monitor stopped');
  }

  private async checkPriceAction(config: OANDAConfig, strategy: StrategySettings) {
    try {
      console.log(`📈 Checking price action for ${strategy.symbol}...`);

      // Convert symbol to OANDA format
      const oandaSymbol = OANDAMarketDataService.convertSymbolToOANDA(strategy.symbol);
      
      // Fetch live market data from OANDA
      const marketData = await OANDAMarketDataService.fetchLiveMarketData(
        config.accountId,
        config.apiKey,
        config.environment,
        oandaSymbol,
        'M1', // 1-minute candles for real-time monitoring
        100   // Last 100 candles for strategy calculation
      );

      console.log(`📊 Fetched ${marketData.close.length} data points for analysis`);

      // Execute Python strategy code to check for signals
      const strategyResult = await PythonExecutor.executeStrategy(
        strategy.strategy_code,
        marketData
      );

      // Get the latest signal (last array element)
      const latestIndex = strategyResult.entry.length - 1;
      const hasEntrySignal = strategyResult.entry[latestIndex];
      const currentPrice = marketData.close[latestIndex];

      // Determine signal type if direction array exists
      let signalType: 'BUY' | 'SELL' | null = null;
      if (hasEntrySignal && strategyResult.direction) {
        signalType = strategyResult.direction[latestIndex] as 'BUY' | 'SELL';
      }

      // Calculate confidence based on recent signals
      const recentSignals = strategyResult.entry.slice(-10);
      const confidence = recentSignals.filter(Boolean).length / recentSignals.length;

      const result: PriceMonitorResult = {
        timestamp: new Date().toISOString(),
        symbol: strategy.symbol,
        currentPrice: currentPrice,
        signalGenerated: hasEntrySignal,
        signalType: signalType,
        confidence: confidence,
        marketData: {
          close: marketData.close.slice(-5), // Last 5 prices
          rsi: strategyResult.rsi?.slice(-1)[0] || null,
          ema_fast: strategyResult.ema_fast?.slice(-1)[0] || null,
          ema_slow: strategyResult.ema_slow?.slice(-1)[0] || null
        }
      };

      // Log the monitoring result
      if (hasEntrySignal && signalType) {
        console.log(`🚨 SIGNAL DETECTED: ${signalType} signal for ${strategy.symbol} at ${currentPrice}`);
        console.log(`📊 Signal confidence: ${(confidence * 100).toFixed(1)}%`);
        
        // Call callback if provided
        if (this.onSignalCallback) {
          this.onSignalCallback(result);
        }
      } else {
        console.log(`📊 No signals detected for ${strategy.symbol} (Price: ${currentPrice})`);
      }

      return result;

    } catch (error) {
      console.error('❌ Error checking price action:', error);
      
      // Return error result
      return {
        timestamp: new Date().toISOString(),
        symbol: strategy.symbol,
        currentPrice: 0,
        signalGenerated: false,
        signalType: null,
        confidence: 0,
        marketData: null
      } as PriceMonitorResult;
    }
  }

  isActive(): boolean {
    return this.isMonitoring;
  }

  // Get current monitoring status
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      hasCallback: !!this.onSignalCallback,
      intervalActive: !!this.monitorInterval
    };
  }
}
