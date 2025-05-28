
import { supabase } from '@/integrations/supabase/client';
import { BacktestStrategy } from '@/types/backtest';

export class MarketDataService {
  static async fetchMarketData(strategy: BacktestStrategy) {
    console.log(`Fetching real data for ${strategy.symbol} with ${strategy.timeframe} timeframe`);
    
    const { data: fetchResponse, error: fetchError } = await supabase.functions.invoke('fetch-forex-data', {
      body: {
        symbol: strategy.symbol,
        interval: strategy.timeframe,
        outputsize: 5000
      }
    });

    if (fetchError) {
      console.error('Error fetching data:', fetchError);
      throw new Error(`Failed to fetch market data: ${fetchError.message}`);
    }

    if (!fetchResponse.success) {
      console.error('API error:', fetchResponse.error);
      throw new Error(fetchResponse.error || 'Failed to fetch market data');
    }

    const marketData = fetchResponse.data;
    console.log(`Fetched ${marketData.length} data points for ${strategy.symbol}`);

    if (marketData.length === 0) {
      throw new Error('No market data available for the selected symbol and timeframe');
    }

    return {
      marketData,
      metadata: fetchResponse.metadata
    };
  }
}
