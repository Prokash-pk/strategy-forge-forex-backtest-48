
import { EnhancedTechnicalAnalysis } from '../technical/EnhancedTechnicalAnalysis';
import { TechnicalAnalysis } from '../technical/TechnicalAnalysis';

export class EnhancedMomentumStrategy {
  static execute(data: any) {
    const { open, high, low, close, volume } = data;
    
    // Calculate technical indicators
    const rsi = TechnicalAnalysis.rsi(close, 14);
    const macd = TechnicalAnalysis.macd(close, 12, 26, 9);
    const ema21 = EnhancedTechnicalAnalysis.ema(close, 21);
    const ema55 = EnhancedTechnicalAnalysis.ema(close, 55);
    const atr = EnhancedTechnicalAnalysis.atr(high, low, close, 14);
    
    // Enhanced filters
    const trends = EnhancedTechnicalAnalysis.detectTrend(close, 21, 55);
    const volatilityFilter = EnhancedTechnicalAnalysis.getVolatilityFilter(high, low, close, 14);
    
    // Create timestamps (mock for demo - in real app would come from data)
    const timestamps = close.map((_, i) => new Date(Date.now() - (close.length - i) * 5 * 60000));
    const sessionFilter = EnhancedTechnicalAnalysis.getSessionFilter(timestamps);
    
    const entry: boolean[] = [];
    const exit: boolean[] = [];
    const signalQuality: number[] = [];
    
    for (let i = 0; i < close.length; i++) {
      if (i < 55) { // Need enough data for all indicators
        entry.push(false);
        exit.push(false);
        signalQuality.push(0);
        continue;
      }
      
      const currentPrice = close[i];
      const trend = trends[i];
      const isHighVol = volatilityFilter[i];
      const isActiveSession = sessionFilter[i];
      const currentRSI = rsi[i] || 50;
      const macdHist = macd.histogram[i] || 0;
      
      // Calculate signal quality score
      const quality = EnhancedTechnicalAnalysis.getSignalQuality(
        currentPrice,
        trend,
        isHighVol,
        isActiveSession,
        currentRSI,
        macdHist
      );
      
      signalQuality.push(quality);
      
      // Enhanced entry conditions - only trade high quality signals
      const minQualityScore = 70; // Require 70%+ quality
      
      // Long entry conditions
      const longConditions = [
        trend === 'uptrend',
        currentPrice > ema21[i] && ema21[i] > ema55[i], // Price above rising EMAs
        currentRSI < 70 && currentRSI > 40, // Not overbought, but has momentum
        macdHist > 0, // Positive MACD momentum
        isHighVol, // High volatility for better breakouts
        isActiveSession, // Active trading hours
        quality >= minQualityScore // High quality signal
      ];
      
      // Short entry conditions  
      const shortConditions = [
        trend === 'downtrend',
        currentPrice < ema21[i] && ema21[i] < ema55[i], // Price below falling EMAs
        currentRSI > 30 && currentRSI < 60, // Not oversold, but has bearish momentum
        macdHist < 0, // Negative MACD momentum
        isHighVol, // High volatility
        isActiveSession, // Active trading hours
        quality >= minQualityScore // High quality signal
      ];
      
      const longEntry = longConditions.every(condition => condition);
      const shortEntry = shortConditions.every(condition => condition);
      
      // Exit conditions - trend breakdown or momentum loss
      const exitConditions = [
        // Trend breakdown
        trend === 'sideways',
        // EMA order breakdown for longs
        (ema21[i] < ema55[i] && ema21[i-1] >= ema55[i-1]),
        // RSI extremes
        currentRSI > 80 || currentRSI < 20,
        // MACD divergence
        Math.abs(macdHist) < Math.abs(macd.histogram[i-1] || 0)
      ];
      
      const shouldExit = exitConditions.some(condition => condition);
      
      entry.push(longEntry || shortEntry);
      exit.push(shouldExit);
    }
    
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
        trends,
        signalQuality
      }
    };
  }
}
