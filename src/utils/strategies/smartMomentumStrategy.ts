
import { EnhancedTechnicalAnalysis } from '../technical/EnhancedTechnicalAnalysis';
import { TechnicalAnalysis } from '../technical/TechnicalAnalysis';
import { AdaptiveRiskManager } from './adaptiveRiskManager';
import { StrategySignals, MarketData } from '../types/strategyTypes';

export class SmartMomentumStrategy {
  static execute(data: MarketData): StrategySignals {
    console.log('Executing Smart Momentum Strategy with enhanced filters...');
    
    const { open, high, low, close, volume } = data;
    
    if (close.length < 100) {
      console.log('Insufficient data for Smart Momentum Strategy');
      return { 
        entry: new Array(close.length).fill(false), 
        exit: new Array(close.length).fill(false),
        indicators: {}
      };
    }
    
    // Technical indicators
    const rsi = TechnicalAnalysis.rsi(close, 14);
    const macd = TechnicalAnalysis.macd(close, 12, 26, 9);
    const ema21 = EnhancedTechnicalAnalysis.ema(close, 21);
    const ema55 = EnhancedTechnicalAnalysis.ema(close, 55);
    const atr = EnhancedTechnicalAnalysis.atr(high, low, close, 14);
    
    // Enhanced market analysis
    const trends = EnhancedTechnicalAnalysis.detectTrend(close, 21, 55);
    const volatilityFilter = EnhancedTechnicalAnalysis.getVolatilityFilter(high, low, close, 14);
    const timestamps = close.map((_, i) => new Date(Date.now() - (close.length - i) * 5 * 60000));
    const sessionFilter = EnhancedTechnicalAnalysis.getSessionFilter(timestamps);
    
    const entry: boolean[] = [];
    const exit: boolean[] = [];
    const stopLossPips: number[] = [];
    const takeProfitPips: number[] = [];
    const signalQuality: number[] = [];
    
    // Convert trends to numeric for compatibility
    const trendNumeric = trends.map(t => t === 'uptrend' ? 1 : t === 'downtrend' ? -1 : 0);
    
    let tradeCount = 0;
    
    for (let i = 0; i < close.length; i++) {
      if (i < 55) {
        entry.push(false);
        exit.push(false);
        stopLossPips.push(50);
        takeProfitPips.push(100);
        signalQuality.push(0);
        continue;
      }
      
      const currentPrice = close[i];
      const trend = trends[i];
      const isHighVol = volatilityFilter[i];
      const isActiveSession = sessionFilter[i];
      const currentRSI = rsi[i] || 50;
      const macdHist = macd.histogram[i] || 0;
      
      // Calculate signal quality
      const quality = EnhancedTechnicalAnalysis.getSignalQuality(
        currentPrice,
        trend,
        isHighVol,
        isActiveSession,
        currentRSI,
        macdHist
      );
      
      signalQuality.push(quality);
      
      // Calculate adaptive risk management
      const adaptiveStopLoss = AdaptiveRiskManager.calculateOptimalStopLoss(atr, i, 40);
      const adaptiveTakeProfit = AdaptiveRiskManager.calculateOptimalTakeProfit(adaptiveStopLoss, quality, 2.0);
      
      stopLossPips.push(adaptiveStopLoss);
      takeProfitPips.push(adaptiveTakeProfit);
      
      // VERY SELECTIVE entry conditions - only the highest probability setups
      const highQualityThreshold = 80; // Require 80%+ signal quality
      
      // Multiple timeframe alignment check
      const shortTermTrend = ema21[i] > ema21[i-1]; // Short term momentum
      const mediumTermTrend = ema21[i] > ema55[i]; // Medium term trend alignment
      
      // Enhanced momentum confirmation
      const strongMomentum = Math.abs(macdHist) > Math.abs(macd.histogram[i-1] || 0);
      const rsiConfirmation = currentRSI > 45 && currentRSI < 75; // Sweet spot for momentum
      
      // Long entry - VERY selective
      const longEntry = 
        quality >= highQualityThreshold &&
        trend === 'uptrend' &&
        shortTermTrend &&
        mediumTermTrend &&
        strongMomentum &&
        macdHist > 0 &&
        rsiConfirmation &&
        isHighVol &&
        isActiveSession &&
        currentPrice > ema21[i] * 1.001; // Small breakout above EMA
      
      // Short entry - VERY selective  
      const shortEntry =
        quality >= highQualityThreshold &&
        trend === 'downtrend' &&
        !shortTermTrend &&
        !mediumTermTrend &&
        strongMomentum &&
        macdHist < 0 &&
        currentRSI > 25 && currentRSI < 55 &&
        isHighVol &&
        isActiveSession &&
        currentPrice < ema21[i] * 0.999; // Small breakdown below EMA
      
      // Exit conditions - quick to exit on adverse conditions
      const trendWeakening = trend === 'sideways';
      const momentumLoss = Math.abs(macdHist) < Math.abs(macd.histogram[i-1] || 0) * 0.8;
      const rsiExtreme = currentRSI > 80 || currentRSI < 20;
      const lowVolatility = !isHighVol;
      
      const shouldExit = trendWeakening || momentumLoss || rsiExtreme || lowVolatility;
      
      if (longEntry || shortEntry) {
        tradeCount++;
        console.log(`High-quality signal ${tradeCount} at bar ${i}: Quality=${quality}%, Trend=${trend}, RSI=${currentRSI.toFixed(1)}, MACD=${macdHist.toFixed(4)}`);
      }
      
      entry.push(longEntry || shortEntry);
      exit.push(shouldExit);
    }
    
    console.log(`Smart Momentum Strategy generated ${tradeCount} high-quality signals`);
    
    return {
      entry,
      exit,
      indicators: {
        rsi,
        macd_line: macd.macd,
        macd_signal: macd.signal,
        macd_histogram: macd.histogram,
        ema21,
        ema55,
        atr,
        trends: trendNumeric, // Convert to numeric array
        signalQuality,
        stopLossPips,
        takeProfitPips
      }
    };
  }
}
