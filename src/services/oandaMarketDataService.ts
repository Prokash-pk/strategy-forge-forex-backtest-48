
export interface OANDACandle {
  time: string;
  bid: {
    o: string;
    h: string;
    l: string;
    c: string;
  };
  ask: {
    o: string;
    h: string;
    l: string;
    c: string;
  };
  volume: number;
}

export interface OANDAMarketData {
  instrument: string;
  granularity: string;
  candles: OANDACandle[];
}

export class OANDAMarketDataService {
  static async fetchLiveMarketData(
    accountId: string,
    apiKey: string,
    environment: 'practice' | 'live',
    instrument: string,
    granularity: string = 'M1',
    count: number = 100
  ): Promise<any> {
    const baseUrl = environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com';

    console.log(`Fetching live market data for ${instrument} from OANDA ${environment}`);

    try {
      const response = await fetch(
        `${baseUrl}/v3/instruments/${instrument}/candles?count=${count}&granularity=${granularity}&price=MBA`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OANDA API Error: ${errorData.errorMessage || response.statusText}`);
      }

      const data: OANDAMarketData = await response.json();
      console.log(`Fetched ${data.candles.length} candles for ${instrument}`);

      // Convert OANDA format to our internal format
      const marketData = {
        open: [] as number[],
        high: [] as number[],
        low: [] as number[],
        close: [] as number[],
        volume: [] as number[],
        Open: [] as number[],
        High: [] as number[],
        Low: [] as number[],
        Close: [] as number[],
        Volume: [] as number[]
      };

      data.candles.forEach((candle) => {
        // Use mid price (average of bid and ask)
        const open = (parseFloat(candle.bid.o) + parseFloat(candle.ask.o)) / 2;
        const high = (parseFloat(candle.bid.h) + parseFloat(candle.ask.h)) / 2;
        const low = (parseFloat(candle.bid.l) + parseFloat(candle.ask.l)) / 2;
        const close = (parseFloat(candle.bid.c) + parseFloat(candle.ask.c)) / 2;
        const volume = candle.volume;

        // Both lowercase and uppercase for compatibility
        marketData.open.push(open);
        marketData.high.push(high);
        marketData.low.push(low);
        marketData.close.push(close);
        marketData.volume.push(volume);

        marketData.Open.push(open);
        marketData.High.push(high);
        marketData.Low.push(low);
        marketData.Close.push(close);
        marketData.Volume.push(volume);
      });

      return marketData;

    } catch (error) {
      console.error('Failed to fetch OANDA market data:', error);
      throw error;
    }
  }

  static convertSymbolToOANDA(symbol: string): string {
    // Convert various symbol formats to OANDA format
    let oandaSymbol = symbol;
    
    if (symbol.includes('=X')) {
      // Yahoo Finance format like USDJPY=X
      oandaSymbol = symbol.replace('=X', '');
    }
    
    if (symbol.includes('/')) {
      // Format like EUR/USD
      oandaSymbol = symbol.replace('/', '_');
    } else if (symbol.length === 6 && !symbol.includes('_')) {
      // Format like EURUSD - convert to EUR_USD
      oandaSymbol = `${symbol.slice(0, 3)}_${symbol.slice(3)}`;
    }

    return oandaSymbol;
  }
}
