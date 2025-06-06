
import { OANDAMarketDataService } from '../oandaMarketDataService';
import { PythonExecutor } from '../pythonExecutor';
import { RealOANDATradeExecutor } from '../oanda/realTradeExecutor';
import { OANDAConfig, StrategySettings } from '@/types/oanda';

export class TestLogger {
  static logTestStart(strategyName: string, symbol: string, intervalSeconds: number) {
    console.log('🚀 ==============================================');
    console.log('🚀 STARTING AUTO STRATEGY TESTING');
    console.log('🚀 ==============================================');
    console.log(`📊 Strategy: ${strategyName}`);
    console.log(`📈 Symbol: ${symbol}`);
    console.log(`⏰ Testing every ${intervalSeconds} seconds`);
    console.log('🚀 ==============================================');
  }

  static logTestStop() {
    console.log('🛑 ==============================================');
    console.log('🛑 AUTO STRATEGY TESTING STOPPED');
    console.log('🛑 ==============================================');
  }

  static async logStrategyTestingCycle(
    config: OANDAConfig,
    strategy: StrategySettings,
    isForwardTestingActive: boolean
  ): Promise<void> {
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n⏰ [${timestamp}] Forward Test Cycle`);
    console.log('═'.repeat(50));

    // Check if forward testing is active
    if (!isForwardTestingActive) {
      console.log(`[⏳] Skipped: Forward testing is not active.`);
      console.log('💡 Enable forward testing in the Control tab to start live trading.');
      return;
    }

    // Check strategy and OANDA config
    if (!strategy || !config.accountId || !config.apiKey) {
      console.log(`[⏳] Skipped: Strategy or OANDA config not set.`);
      console.log('💡 Complete OANDA setup and select a strategy to begin testing.');
      return;
    }

    try {
      console.log(`🔍 Strategy: ${strategy.strategy_name}`);
      console.log(`📊 Symbol: ${strategy.symbol}`);
      console.log(`🏦 OANDA Account: ${config.accountId}`);
      console.log(`🌍 Environment: ${config.environment.toUpperCase()}`);

      // Convert symbol to OANDA format
      const oandaSymbol = OANDAMarketDataService.convertSymbolToOANDA(strategy.symbol);
      console.log(`🔄 Fetching live data for: ${oandaSymbol}`);

      // Fetch latest market data
      const marketData = await OANDAMarketDataService.fetchLiveMarketData(
        config.accountId,
        config.apiKey,
        config.environment,
        oandaSymbol,
        'M1',
        100
      );

      const latestIndex = marketData.close.length - 1;
      const currentPrice = marketData.close[latestIndex];
      
      console.log(`📈 Current Market Price: ${currentPrice}`);
      console.log(`📊 Candle Data: O:${marketData.open[latestIndex]} H:${marketData.high[latestIndex]} L:${marketData.low[latestIndex]} C:${currentPrice}`);

      // Execute strategy logic
      console.log(`🧠 Running strategy analysis...`);
      const strategyResult = await PythonExecutor.executeStrategy(
        strategy.strategy_code,
        marketData
      );

      // Check for signals
      const hasEntry = strategyResult.entry && strategyResult.entry[latestIndex];
      const direction = strategyResult.direction && strategyResult.direction[latestIndex];

      console.log(`🔍 Signal Analysis:`);
      console.log(`   Entry Signal: ${hasEntry ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
      console.log(`   Direction: ${direction || 'NONE'}`);

      if (hasEntry && direction && (direction === 'BUY' || direction === 'SELL')) {
        console.log(`\n🚨 ═══ TRADE SIGNAL DETECTED ═══ 🚨`);
        console.log(`✅ Signal Matched: ${direction}`);
        console.log(`🎯 Entry Price: ${currentPrice}`);
        console.log(`🚀 Preparing to place ${direction} order...`);

        // Create trade executor
        const tradeExecutor = new RealOANDATradeExecutor(
          config.accountId,
          config.apiKey,
          config.environment
        );

        // Calculate position size (default to 10,000 units for demo)
        const units = 10000;

        console.log(`📏 Position Size: ${units} units`);
        
        // Place the order
        const tradeResult = await tradeExecutor.executeTrade({
          symbol: strategy.symbol,
          action: direction,
          units: units,
          confidence: 0.8
        });

        if (tradeResult.success) {
          console.log(`✅ 📌 ORDER EXECUTED SUCCESSFULLY!`);
          console.log(`🆔 Trade ID: ${tradeResult.tradeId}`);
          console.log(`💰 Fill Price: ${tradeResult.fillPrice}`);
          console.log(`🎯 This was a REAL ${direction} trade on ${config.environment.toUpperCase()} account!`);
        } else {
          console.log(`❌ ORDER FAILED: ${tradeResult.error}`);
          console.log(`🔧 Check your OANDA configuration and account status.`);
        }

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
      console.error(`❌ Forward Test Cycle Error:`, error);
      console.log(`🔧 Check your OANDA credentials and network connection.`);
    }

    console.log('═'.repeat(50));
  }
}
