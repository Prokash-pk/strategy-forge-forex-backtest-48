
export class MarketDataProcessor {
  static setMarketDataInPython(pyodide: any, marketData: any): void {
    console.log('📊 Setting market data in Python environment...');
    
    pyodide.globals.set('open_prices', marketData.open || []);
    pyodide.globals.set('high_prices', marketData.high || []);
    pyodide.globals.set('low_prices', marketData.low || []);
    pyodide.globals.set('close_prices', marketData.close || []);
    pyodide.globals.set('volume_data', marketData.volume || []);
  }

  static logMarketDataInfo(marketData: any): void {
    console.log('📊 Market data input:', {
      hasOpen: !!marketData.open,
      hasHigh: !!marketData.high,
      hasLow: !!marketData.low,
      hasClose: !!marketData.close,
      hasVolume: !!marketData.volume,
      closeLength: marketData.close?.length || 0
    });
  }
}
