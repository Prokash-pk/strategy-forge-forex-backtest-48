
import { OANDAMarketDataService } from '../oandaMarketDataService';
import { PythonExecutor } from '../pythonExecutor';
import { OANDAConfig, StrategySettings } from '@/types/oanda';

export class ConsoleLogger {
  private static currentConfig: OANDAConfig | null = null;
  private static currentStrategy: StrategySettings | null = null;

  static setConfiguration(config: OANDAConfig, strategy: StrategySettings) {
    this.currentConfig = config;
    this.currentStrategy = strategy;
    console.log('🔧 Console logger configured for LIVE TRADING:', strategy.strategy_name);
  }

  static async runConsoleLogCycle(): Promise<void> {
    const now = new Date().toLocaleTimeString();
    console.log(`\n🕒 [${now}] === LIVE TRADING MONITOR ===`);
    console.log('═'.repeat(60));

    if (!this.currentConfig || !this.currentStrategy) {
      console.log(`[${now}] ⚠️ CRITICAL: No strategy configuration available for monitoring.`);
      console.log('🔧 Ensure forward testing is properly started and configured');
      return;
    }

    try {
      console.log(`🔍 LIVE MONITORING: ${this.currentStrategy.strategy_name}`);
      console.log(`📊 Symbol: ${this.currentStrategy.symbol}`);
      console.log(`🏦 OANDA Account: ${this.currentConfig.accountId}`);
      console.log(`🌍 Environment: ${this.currentConfig.environment}`);

      // Convert symbol to OANDA format
      const oandaSymbol = OANDAMarketDataService.convertSymbolToOANDA(this.currentStrategy.symbol);
      console.log(`🔄 Fetching LIVE market data for: ${oandaSymbol}`);

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
      
      console.log(`💰 LIVE Price: ${currentPrice}`);
      console.log(`📊 Latest Candle: O:${marketData.open[latestIndex]} H:${marketData.high[latestIndex]} L:${marketData.low[latestIndex]} C:${currentPrice}`);

      // Execute strategy logic
      console.log(`🧠 Analyzing strategy for LIVE TRADE signals...`);
      const strategyResult = await PythonExecutor.executeStrategy(
        this.currentStrategy.strategy_code,
        marketData
      );

      // Check for signals
      const hasEntry = strategyResult.entry && strategyResult.entry[latestIndex];
      const direction = strategyResult.direction && strategyResult.direction[latestIndex];

      console.log(`🔍 LIVE Signal Analysis:`);
      console.log(`   Entry Signal: ${hasEntry ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
      console.log(`   Direction: ${direction || 'NONE'}`);

      if (hasEntry && direction && (direction === 'BUY' || direction === 'SELL')) {
        console.log(`\n🚨 🚨 🚨 LIVE TRADE SIGNAL DETECTED 🚨 🚨 🚨`);
        console.log(`🎯 LIVE TRADE Action: ${direction} ${this.currentStrategy.symbol}`);
        console.log(`💰 Entry Price: ${currentPrice}`);
        console.log(`⚡ THIS WILL EXECUTE A REAL TRADE ON OANDA!`);
        console.log(`🚀 Signal being processed by live trading system...`);
      } else {
        console.log(`\n📊 No trade signals detected - system continues monitoring`);
        console.log(`🔍 Waiting for valid entry conditions...`);
        
        // Log additional technical indicators for debugging
        if (strategyResult.rsi && strategyResult.rsi[latestIndex]) {
          console.log(`📈 RSI: ${strategyResult.rsi[latestIndex].toFixed(2)}`);
        }
        if (strategyResult.ema_fast && strategyResult.ema_fast[latestIndex]) {
          console.log(`📊 EMA Fast: ${strategyResult.ema_fast[latestIndex].toFixed(5)}`);
        }
        if (strategyResult.ema_slow && strategyResult.ema_slow[latestIndex]) {
          console.log(`📊 EMA Slow: ${strategyResult.ema_slow[latestIndex].toFixed(5)}`);
        }
      }

      console.log(`\n⏰ Next check in 30 seconds...`);

    } catch (error) {
      console.error(`❌ [${now}] LIVE TRADING MONITOR ERROR:`, error);
      console.log(`🔧 Check OANDA credentials and network connection`);
      console.log(`⚠️ LIVE TRADING may be affected - verify system status`);
    }

    console.log('═'.repeat(60));
  }

  static clearConfiguration() {
    this.currentConfig = null;
    this.currentStrategy = null;
    console.log('🧹 LIVE TRADING monitor configuration cleared');
  }
}

// Export convenience function for direct usage
export const runConsoleLogCycle = () => ConsoleLogger.runConsoleLogCycle();

// Bind to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testLiveTradingCycle = runConsoleLogCycle;
  (window as any).liveConsoleLogger = ConsoleLogger;
  console.log('🧪 Debug functions available: testLiveTradingCycle(), liveConsoleLogger');
}
