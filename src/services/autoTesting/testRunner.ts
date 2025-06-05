
import { OANDAMarketDataService } from '../oandaMarketDataService';
import { PythonExecutor } from '../pythonExecutor';
import { OANDAConfig, StrategySettings } from '@/types/oanda';
import { AutoTestResult } from './types';

export class StrategyTestRunner {
  static async runSingleTest(config: OANDAConfig, strategy: StrategySettings): Promise<AutoTestResult> {
    try {
      const timestamp = new Date().toISOString();
      
      console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Testing Strategy Signals...`);
      console.log('=' .repeat(60));

      // Convert symbol to OANDA format
      const oandaSymbol = OANDAMarketDataService.convertSymbolToOANDA(strategy.symbol);
      console.log(`🔍 Fetching live data for: ${oandaSymbol}`);

      // Fetch live market data
      const marketData = await OANDAMarketDataService.fetchLiveMarketData(
        config.accountId,
        config.apiKey,
        config.environment,
        oandaSymbol,
        'M1', // 1-minute candles
        100   // Last 100 candles for strategy analysis
      );

      console.log(`📊 Fetched ${marketData.close.length} data points`);

      // Get current candle data
      const latestIndex = marketData.close.length - 1;
      const currentCandle = {
        open: marketData.open[latestIndex],
        high: marketData.high[latestIndex],
        low: marketData.low[latestIndex],
        close: marketData.close[latestIndex],
        volume: marketData.volume[latestIndex]
      };

      console.log('📈 Current Candle Data:');
      console.log(`   Open: ${currentCandle.open}`);
      console.log(`   High: ${currentCandle.high}`);
      console.log(`   Low: ${currentCandle.low}`);
      console.log(`   Close: ${currentCandle.close}`);
      console.log(`   Volume: ${currentCandle.volume}`);

      // Execute strategy against market data
      console.log('🧠 Executing strategy logic...');
      const strategyResult = await PythonExecutor.executeStrategy(
        strategy.strategy_code,
        marketData
      );

      // Extract latest signals
      const hasEntry = strategyResult.entry && strategyResult.entry[latestIndex];
      const hasExit = strategyResult.exit && strategyResult.exit[latestIndex];
      
      // Determine trade direction
      let direction: 'BUY' | 'SELL' | null = null;
      if (hasEntry && strategyResult.direction && strategyResult.direction[latestIndex]) {
        direction = strategyResult.direction[latestIndex] as 'BUY' | 'SELL';
      }

      // Calculate confidence based on recent signals
      const recentSignals = strategyResult.entry?.slice(-10) || [];
      const confidence = recentSignals.filter(Boolean).length / recentSignals.length;

      // Extract technical indicators
      const technicalIndicators = {
        rsi: strategyResult.rsi?.[latestIndex],
        ema_fast: strategyResult.ema_fast?.[latestIndex] || strategyResult.short_ema?.[latestIndex],
        ema_slow: strategyResult.ema_slow?.[latestIndex] || strategyResult.long_ema?.[latestIndex],
        macd: strategyResult.macd?.[latestIndex]
      };

      // Log strategy analysis results
      console.log('🔬 Strategy Analysis Results:');
      console.log(`   Entry Signal: ${hasEntry ? '✅ YES' : '❌ NO'}`);
      console.log(`   Exit Signal: ${hasExit ? '✅ YES' : '❌ NO'}`);
      console.log(`   Trade Direction: ${direction || 'NONE'}`);
      console.log(`   Signal Confidence: ${(confidence * 100).toFixed(1)}%`);

      console.log('📊 Technical Indicators:');
      if (technicalIndicators.rsi) console.log(`   RSI: ${technicalIndicators.rsi.toFixed(2)}`);
      if (technicalIndicators.ema_fast) console.log(`   EMA Fast: ${technicalIndicators.ema_fast.toFixed(5)}`);
      if (technicalIndicators.ema_slow) console.log(`   EMA Slow: ${technicalIndicators.ema_slow.toFixed(5)}`);
      if (technicalIndicators.macd) console.log(`   MACD: ${technicalIndicators.macd.toFixed(5)}`);

      // Signal detection summary
      if (hasEntry && direction) {
        console.log('🚨 🚨 🚨 TRADE SIGNAL DETECTED 🚨 🚨 🚨');
        console.log(`🎯 Action: ${direction} ${strategy.symbol}`);
        console.log(`💰 Price: ${currentCandle.close}`);
        console.log(`🎲 Confidence: ${(confidence * 100).toFixed(1)}%`);
      } else {
        console.log('🔍 No trade signals detected - monitoring continues...');
      }

      console.log('=' .repeat(60));

      const result: AutoTestResult = {
        timestamp,
        symbol: strategy.symbol,
        currentPrice: currentCandle.close,
        candleData: currentCandle,
        strategySignals: {
          hasEntry,
          hasExit,
          direction,
          confidence
        },
        technicalIndicators
      };

      return result;

    } catch (error) {
      console.error('❌ Auto-testing error:', error);
      
      return {
        timestamp: new Date().toISOString(),
        symbol: strategy.symbol,
        currentPrice: 0,
        candleData: { open: 0, high: 0, low: 0, close: 0, volume: 0 },
        strategySignals: { hasEntry: false, hasExit: false, direction: null, confidence: 0 },
        technicalIndicators: {}
      };
    }
  }
}
