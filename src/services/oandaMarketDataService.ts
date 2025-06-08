
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
    // Validate inputs first
    if (!accountId || !apiKey || !instrument) {
      console.error('❌ Missing required OANDA credentials or instrument');
      throw new Error('Missing OANDA credentials or instrument');
    }

    const baseUrl = environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com';

    console.log(`🔄 Fetching live market data for ${instrument} from OANDA ${environment}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(
        `${baseUrl}/v3/instruments/${instrument}/candles?count=${count}&granularity=${granularity}&price=MBA`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept-Datetime-Format': 'UNIX'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.errorMessage || errorData.message || errorMessage;
          
          // Provide specific guidance for common errors
          if (response.status === 401) {
            errorMessage = 'Invalid OANDA API key. Please check your credentials in the Configuration tab.';
          } else if (response.status === 403) {
            errorMessage = 'OANDA API access forbidden. Verify your API key permissions.';
          } else if (response.status === 404) {
            errorMessage = `Instrument ${instrument} not found. Check the symbol format.`;
          } else if (response.status === 400) {
            errorMessage = `Bad request to OANDA API. Check instrument format: ${instrument}`;
          }
        } catch (parseError) {
          console.warn('Could not parse OANDA error response:', parseError);
        }
        
        console.error(`❌ OANDA API Error for ${instrument}:`, errorMessage);
        throw new Error(errorMessage);
      }

      const data: OANDAMarketData = await response.json();
      
      if (!data.candles || data.candles.length === 0) {
        console.warn(`⚠️ No candles received for ${instrument}`);
        throw new Error(`No market data available for ${instrument}`);
      }

      console.log(`✅ Fetched ${data.candles.length} candles for ${instrument}`);

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
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = 'OANDA API request timeout (10s). Check your internet connection.';
        console.error('❌', timeoutError);
        throw new Error(timeoutError);
      }
      
      console.error('❌ Failed to fetch OANDA market data:', error);
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

    // Validate the format
    if (!oandaSymbol.includes('_') || oandaSymbol.length < 7) {
      console.warn(`⚠️ Potentially invalid OANDA symbol format: ${oandaSymbol}`);
    }

    return oandaSymbol;
  }

  // Add retry mechanism for failed requests
  static async fetchWithRetry(
    accountId: string,
    apiKey: string,
    environment: 'practice' | 'live',
    instrument: string,
    granularity: string = 'M1',
    count: number = 100,
    maxRetries: number = 3
  ): Promise<any> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 OANDA API attempt ${attempt}/${maxRetries} for ${instrument}`);
        return await this.fetchLiveMarketData(accountId, apiKey, environment, instrument, granularity, count);
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ OANDA API attempt ${attempt} failed:`, error);
        
        // Don't retry on authentication errors
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('Invalid API key'))) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
}
