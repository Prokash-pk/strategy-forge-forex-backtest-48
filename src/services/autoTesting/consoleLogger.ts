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
    console.log('📊 Symbol:', strategy.symbol, '| Environment:', config.environment);
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
      console.log(`📊 Original Symbol: ${this.currentStrategy.symbol}`);
      console.log(`🏦 OANDA Account: ${this.currentConfig.accountId}`);
      console.log(`🌍 Environment: ${this.currentConfig.environment}`);

      // Convert symbol to OANDA format and log the conversion
      const oandaSymbol = OANDAMarketDataService.convertSymbolToOANDA(this.currentStrategy.symbol);
      console.log(`🔄 OANDA Symbol: ${oandaSymbol} (converted from ${this.currentStrategy.symbol})`);

      // Validate the converted symbol before making the API call
      if (!oandaSymbol.includes('_') || oandaSymbol.length !== 7) {
        console.error(`❌ Invalid OANDA symbol format: ${oandaSymbol}`);
        console.log('Expected format: XXX_YYY (e.g., USD_JPY, EUR_USD)');
        console.log('🔧 Please check your strategy symbol configuration');
        return;
      }

      console.log(`🔄 Fetching LIVE market data for: ${oandaSymbol}`);

      // Use retry mechanism for better reliability
      const marketData = await OANDAMarketDataService.fetchWithRetry(
        this.currentConfig.accountId,
        this.currentConfig.apiKey,
        this.currentConfig.environment,
        oandaSymbol,
        'M1',
        100,
        2 // Max 2 retries for console logging
      );

      const latestIndex = marketData.close.length - 1;
      const currentPrice = marketData.close[latestIndex];
      
      console.log(`💰 LIVE Price: ${currentPrice.toFixed(5)}`);
      console.log(`📊 Latest Candle: O:${marketData.open[latestIndex].toFixed(5)} H:${marketData.high[latestIndex].toFixed(5)} L:${marketData.low[latestIndex].toFixed(5)} C:${currentPrice.toFixed(5)}`);

      // Execute strategy logic with error handling
      console.log(`🧠 Analyzing strategy for LIVE TRADE signals...`);
      
      let strategyResult;
      try {
        strategyResult = await PythonExecutor.executeStrategy(
          this.currentStrategy.strategy_code,
          marketData
        );
      } catch (strategyError) {
        console.error(`❌ Strategy execution error:`, strategyError);
        console.log(`🔧 Check your strategy code for syntax or logic errors`);
        return;
      }

      // Check for signals
      const hasEntry = strategyResult.entry && strategyResult.entry[latestIndex];
      const direction = strategyResult.direction && strategyResult.direction[latestIndex];

      console.log(`🔍 LIVE Signal Analysis:`);
      console.log(`   Entry Signal: ${hasEntry ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
      console.log(`   Direction: ${direction || 'NONE'}`);

      if (hasEntry && direction && (direction === 'BUY' || direction === 'SELL')) {
        console.log(`\n🚨 🚨 🚨 LIVE TRADE SIGNAL DETECTED 🚨 🚨 🚨`);
        console.log(`🎯 LIVE TRADE Action: ${direction} ${this.currentStrategy.symbol}`);
        console.log(`💰 Entry Price: ${currentPrice.toFixed(5)}`);
        console.log(`⚡ THIS WILL EXECUTE A REAL TRADE ON OANDA!`);
        console.log(`🚀 Signal being processed by live trading system...`);
        
        // Log stop loss and take profit if available
        if (strategyResult.stopLoss && strategyResult.stopLoss[latestIndex]) {
          console.log(`🛡️ Stop Loss: ${strategyResult.stopLoss[latestIndex].toFixed(5)}`);
        }
        if (strategyResult.takeProfit && strategyResult.takeProfit[latestIndex]) {
          console.log(`🎯 Take Profit: ${strategyResult.takeProfit[latestIndex].toFixed(5)}`);
        }
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
        
        // Add market condition analysis
        const priceChange = marketData.close[latestIndex] - marketData.close[latestIndex - 1];
        const trend = priceChange > 0 ? '📈 Rising' : priceChange < 0 ? '📉 Falling' : '➡️ Flat';
        console.log(`📊 Market Trend: ${trend} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(5)})`);
      }

      console.log(`\n⏰ Next check in 60 seconds...`);

    } catch (error) {
      console.error(`❌ [${now}] LIVE TRADING MONITOR ERROR:`, error);
      
      // Provide specific error guidance
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Invalid API key')) {
          console.log(`🔑 Fix: Update your OANDA API key in the Configuration tab`);
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          console.log(`🔧 Fix: Check the symbol format (${this.currentStrategy.symbol}) in Strategy settings`);
          console.log(`Expected: 6-letter format like USDJPY, EURUSD, GBPUSD`);
        } else if (error.message.includes('400') || error.message.includes('Invalid value specified for')) {
          console.log(`🔧 Fix: Invalid symbol format - ${this.currentStrategy.symbol}`);
          console.log(`Try using: USDJPY, EURUSD, GBPUSD format (no slashes, equals signs, or underscores)`);
        } else if (error.message.includes('timeout')) {
          console.log(`🌐 Fix: Check your internet connection and try again`);
        } else {
          console.log(`💥 Error details: ${error.message}`);
        }
      }
      
      console.log(`⚠️ LIVE TRADING may be affected - verify system status in Diagnostic tab`);
    }

    console.log('═'.repeat(60));
  }

  static clearConfiguration() {
    this.currentConfig = null;
    this.currentStrategy = null;
    console.log('🧹 LIVE TRADING monitor configuration cleared');
  }

  static getStatus() {
    return {
      configured: !!(this.currentConfig && this.currentStrategy),
      strategy: this.currentStrategy?.strategy_name || null,
      symbol: this.currentStrategy?.symbol || null,
      environment: this.currentConfig?.environment || null
    };
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
