
// Service to ensure consistency between backtest and live data
import { OANDAMarketDataService } from './oandaMarketDataService';

export interface DataConsistencyConfig {
  symbol: string;
  timeframe: string;
  lookbackPeriods: number;
  oandaConfig: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  };
}

export interface ConsistencyReport {
  isConsistent: boolean;
  dataDifference: number; // percentage difference
  lastBacktestData: any;
  currentLiveData: any;
  recommendations: string[];
}

export class DataConsistencyService {
  static async validateDataConsistency(config: DataConsistencyConfig): Promise<ConsistencyReport> {
    try {
      console.log('🔍 Validating data consistency for', config.symbol);
      
      // Get live data from OANDA
      const liveData = await OANDAMarketDataService.fetchLiveMarketData(
        config.oandaConfig.accountId,
        config.oandaConfig.apiKey,
        config.oandaConfig.environment,
        config.symbol,
        this.convertTimeframeToOANDA(config.timeframe),
        config.lookbackPeriods
      );
      
      // Get cached backtest data (if available)
      const backtestData = this.getCachedBacktestData(config.symbol, config.timeframe);
      
      if (!backtestData) {
        return {
          isConsistent: false,
          dataDifference: 0,
          lastBacktestData: null,
          currentLiveData: liveData,
          recommendations: [
            'No backtest data found for comparison',
            'Run a backtest first to establish baseline data',
            'Use OANDA data for both backtest and live trading for consistency'
          ]
        };
      }
      
      // Compare the overlapping periods
      const consistency = this.compareDataSets(backtestData, liveData);
      
      return {
        isConsistent: consistency.difference < 5, // 5% threshold
        dataDifference: consistency.difference,
        lastBacktestData: backtestData,
        currentLiveData: liveData,
        recommendations: this.generateRecommendations(consistency.difference)
      };
      
    } catch (error) {
      console.error('❌ Data consistency validation failed:', error);
      throw error;
    }
  }
  
  private static convertTimeframeToOANDA(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': 'M1',
      '5m': 'M5', 
      '15m': 'M15',
      '30m': 'M30',
      '1h': 'H1',
      '4h': 'H4',
      '1d': 'D',
      'M1': 'M1',
      'M5': 'M5',
      'M15': 'M15',
      'M30': 'M30',
      'H1': 'H1',
      'H4': 'H4',
      'D': 'D'
    };
    
    return mapping[timeframe] || 'M5';
  }
  
  private static getCachedBacktestData(symbol: string, timeframe: string): any {
    try {
      const cacheKey = `backtest_data_${symbol}_${timeframe}`;
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Could not retrieve cached backtest data:', error);
      return null;
    }
  }
  
  private static compareDataSets(backtestData: any, liveData: any): { difference: number } {
    if (!backtestData?.close || !liveData?.close) {
      return { difference: 100 }; // 100% different if no data
    }
    
    // Compare last 20 candles (or available length)
    const compareLength = Math.min(20, backtestData.close.length, liveData.close.length);
    
    if (compareLength === 0) {
      return { difference: 100 };
    }
    
    let totalDifference = 0;
    
    for (let i = 0; i < compareLength; i++) {
      const backIndex = backtestData.close.length - compareLength + i;
      const liveIndex = liveData.close.length - compareLength + i;
      
      const backPrice = backtestData.close[backIndex];
      const livePrice = liveData.close[liveIndex];
      
      if (backPrice && livePrice) {
        const priceDiff = Math.abs(backPrice - livePrice) / backPrice * 100;
        totalDifference += priceDiff;
      }
    }
    
    return { difference: totalDifference / compareLength };
  }
  
  private static generateRecommendations(difference: number): string[] {
    const recommendations: string[] = [];
    
    if (difference > 10) {
      recommendations.push('⚠️ High data inconsistency detected (>10%)');
      recommendations.push('Consider using OANDA data for backtesting');
      recommendations.push('Review data sources and timeframe alignment');
    } else if (difference > 5) {
      recommendations.push('⚠️ Moderate data inconsistency (5-10%)');
      recommendations.push('Monitor live performance closely');
      recommendations.push('Consider re-running backtest with OANDA data');
    } else {
      recommendations.push('✅ Data consistency looks good (<5% difference)');
      recommendations.push('Live trading should perform similarly to backtest');
    }
    
    recommendations.push('Use consistent data sources for best results');
    recommendations.push('Account for spread differences between backtest and live');
    
    return recommendations;
  }
  
  static cacheBacktestData(symbol: string, timeframe: string, data: any): void {
    try {
      const cacheKey = `backtest_data_${symbol}_${timeframe}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        ...data,
        cachedAt: new Date().toISOString()
      }));
      console.log('💾 Cached backtest data for consistency checking');
    } catch (error) {
      console.warn('Could not cache backtest data:', error);
    }
  }
}
