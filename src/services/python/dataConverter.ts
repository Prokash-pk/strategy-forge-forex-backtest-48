
import type { MarketData } from './types';

export class DataConverter {
  static convertMarketData(marketData: MarketData): any {
    console.log('📊 Converting market data for Python execution...');
    
    // Convert market data to plain JavaScript object with proper data conversion
    const plainMarketData = {
      open: Array.from(marketData.open).map(x => Number(x)),
      high: Array.from(marketData.high).map(x => Number(x)),
      low: Array.from(marketData.low).map(x => Number(x)),
      close: Array.from(marketData.close).map(x => Number(x)),
      volume: Array.from(marketData.volume).map(x => Number(x))
    };
    
    console.log('📈 Market data converted:', {
      dataPoints: plainMarketData.close.length,
      sampleClose: plainMarketData.close.slice(0, 3),
      sampleHigh: plainMarketData.high.slice(0, 3)
    });
    
    return plainMarketData;
  }

  static validateMarketData(marketData: MarketData): { isValid: boolean; error?: string } {
    if (!marketData || !marketData.close || marketData.close.length === 0) {
      return { isValid: false, error: 'Invalid market data: no close prices available' };
    }

    const closeArray = Array.from(marketData.close);
    if (closeArray.some(isNaN)) {
      return { isValid: false, error: 'Invalid market data: NaN values detected in close prices' };
    }

    return { isValid: true };
  }
}
