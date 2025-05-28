
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ForexDataRequest {
  symbol: string;
  interval: string;
  outputsize?: number;
}

// Convert Yahoo Finance symbol format to Twelve Data format
function convertSymbolFormat(symbol: string): string {
  // Remove =X suffix and convert to proper forex format
  if (symbol.endsWith('=X')) {
    const cleanSymbol = symbol.replace('=X', '');
    // Insert slash between currency pairs (e.g., EURUSD -> EUR/USD)
    if (cleanSymbol.length === 6) {
      return `${cleanSymbol.slice(0, 3)}/${cleanSymbol.slice(3)}`;
    }
  }
  return symbol;
}

// Convert interval format to Twelve Data format
function convertIntervalFormat(interval: string): string {
  const intervalMap: { [key: string]: string } = {
    '1m': '1min',
    '2m': '2min',
    '5m': '5min',
    '15m': '15min',
    '30m': '30min',
    '1h': '1h',
    '2h': '2h',
    '4h': '4h',
    '8h': '8h',
    '1d': '1day',
    '1wk': '1week',
    '1mo': '1month'
  };
  
  return intervalMap[interval] || interval;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, interval, outputsize = 5000 }: ForexDataRequest = await req.json();
    
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) {
      console.error('TWELVE_DATA_API_KEY not found in environment');
      throw new Error('API key not configured');
    }

    // Convert symbol and interval to Twelve Data format
    const convertedSymbol = convertSymbolFormat(symbol);
    const convertedInterval = convertIntervalFormat(interval);
    console.log(`Converting symbol ${symbol} to ${convertedSymbol}`);
    console.log(`Converting interval ${interval} to ${convertedInterval}`);
    console.log(`Fetching data for ${convertedSymbol} with interval ${convertedInterval}`);

    // Build Twelve Data API URL
    const baseUrl = 'https://api.twelvedata.com/time_series';
    const params = new URLSearchParams({
      symbol: convertedSymbol,
      interval: convertedInterval,
      outputsize: outputsize.toString(),
      apikey: apiKey,
      format: 'JSON'
    });

    const response = await fetch(`${baseUrl}?${params}`);
    
    if (!response.ok) {
      console.error(`Twelve Data API error: ${response.status} ${response.statusText}`);
      throw new Error(`Twelve Data API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code && data.code !== 200) {
      console.error('Twelve Data API returned error:', data);
      throw new Error(data.message || 'API request failed');
    }

    if (!data.values || !Array.isArray(data.values)) {
      console.error('Invalid data format from Twelve Data:', data);
      throw new Error('Invalid data format received from API');
    }

    // Transform data to our format
    const transformedData = data.values.map((item: any) => ({
      date: item.datetime,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseFloat(item.volume || '0')
    })).reverse(); // Reverse to get chronological order

    console.log(`Successfully fetched ${transformedData.length} data points`);

    return new Response(
      JSON.stringify({
        success: true,
        data: transformedData,
        metadata: {
          symbol: data.meta?.symbol || convertedSymbol,
          interval: data.meta?.interval || convertedInterval,
          currency_base: data.meta?.currency_base,
          currency_quote: data.meta?.currency_quote,
          type: data.meta?.type
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in fetch-forex-data:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
