
import { OANDAMarketDataService } from '../oandaMarketDataService';
import { PythonExecutor } from '../pythonExecutor';
import { OANDAConfig, StrategySettings } from '@/types/oanda';

export class ConsoleLogger {
  private static currentConfig: OANDAConfig | null = null;
  private static currentStrategy: StrategySettings | null = null;

  static setConfiguration(config: OANDAConfig, strategy: StrategySettings) {
    this.currentConfig = config;
    this.currentStrategy = strategy;
    console.log('🔧 Console logger configured for:', strategy.strategy_name);
  }

  static async runConsoleLogCycle(): Promise<void> {
    const now = new Date().toLocaleTimeString();
    console.log(`\n⏰ [${now}] Strategy Evaluation Cycle`);
    console.log('═'.repeat(50));

    if (!this.currentConfig || !this.currentStrategy) {
      console.log(`[${now}] ⚠️ No strategy configuration available.`);
      return;
    }

    try {
      console.log(`🔍 Checking ${this.currentStrategy.strategy_name}...`);
      console.log(`📊 Symbol: ${this.currentStrategy.symbol}`);

      // Convert symbol to OANDA format
      const oandaSymbol = OANDAMarketDataService.convertSymbolToOANDA(this.currentStrategy.symbol);
      console.log(`🔄 Fetching live data for: ${oandaSymbol}`);

      // Fetch latest market data
      const marketData = await OANDAMarketDataService.fetchLiveMarketData(
        this.currentConfig.accountId,
        this.currentConfig.apiKey,
        this.currentConfig.environment,
        oandaSymbol,
        'M1',
        100
      );

      const latestIndex = marketData.close.length - 1;
      const currentPrice = marketData.close[latestIndex];
      
      console.log(`📈 Current Price: ${currentPrice}`);
      console.log(`📊 Latest Candle: O:${marketData.open[latestIndex]} H:${marketData.high[latestIndex]} L:${marketData.low[latestIndex]} C:${currentPrice}`);

      // Execute strategy logic
      console.log(`🧠 Evaluating strategy signals...`);
      const strategyResult = await PythonExecutor.executeStrategy(
        this.currentStrategy.strategy_code,
        marketData
      );

      // Check for signals
      const hasEntry = strategyResult.entry && strategyResult.entry[latestIndex];
      const direction = strategyResult.direction && strategyResult.direction[latestIndex];

      console.log(`🔍 Signal Analysis:`);
      console.log(`   Entry Signal: ${hasEntry ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
      console.log(`   Direction: ${direction || 'NONE'}`);

      if (hasEntry && direction && (direction === 'BUY' || direction === 'SELL')) {
        console.log(`\n🚨 🚨 🚨 TRADE SIGNAL DETECTED 🚨 🚨 🚨`);
        console.log(`🎯 Action: ${direction} ${this.currentStrategy.symbol}`);
        console.log(`💰 Entry Price: ${currentPrice}`);
        console.log(`🚀 This signal would trigger a REAL trade!`);
      } else {
        console.log(`\n❌ No valid entry signal at this time.`);
        console.log(`🔍 Strategy monitoring continues...`);
        
        // Log technical indicators if available
        if (strategyResult.rsi && strategyResult.rsi[latestIndex]) {
          console.log(`📊 RSI: ${strategyResult.rsi[latestIndex].toFixed(2)}`);
        }
        if (strategyResult.ema_fast && strategyResult.ema_fast[latestIndex]) {
          console.log(`📈 EMA Fast: ${strategyResult.ema_fast[latestIndex].toFixed(5)}`);
        }
        if (strategyResult.ema_slow && strategyResult.ema_slow[latestIndex]) {
          console.log(`📉 EMA Slow: ${strategyResult.ema_slow[latestIndex].toFixed(5)}`);
        }
      }

    } catch (error) {
      console.error(`❌ [${now}] Strategy evaluation error:`, error);
      console.log(`🔧 Check your OANDA credentials and network connection.`);
    }

    console.log('═'.repeat(50));
  }

  static clearConfiguration() {
    this.currentConfig = null;
    this.currentStrategy = null;
    console.log('🧹 Console logger configuration cleared');
  }
}

// Export convenience function for direct usage
export const runConsoleLogCycle = () => ConsoleLogger.runConsoleLogCycle();

// Bind to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testStrategyCycle = runConsoleLogCycle;
  (window as any).consoleLogger = ConsoleLogger;
}
