
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol, interval, outputsize = 'compact' } = await req.json()
    
    // For demo purposes, generate sample forex data
    // In production, you would fetch from a real API like Twelve Data
    const sampleData = generateSampleForexData(symbol, interval, outputsize === 'full' ? 5000 : 100)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: sampleData,
        metadata: {
          symbol: symbol,
          interval: interval,
          currency_base: symbol.split('/')[0] || 'EUR',
          currency_quote: symbol.split('/')[1] || 'USD',
          type: 'forex'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Data fetch error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

function generateSampleForexData(symbol: string, interval: string, count: number) {
  const data = []
  const now = new Date()
  let currentPrice = 1.1000 // Starting price for EUR/USD
  
  // Add some volatility based on symbol
  if (symbol.includes('GBP')) currentPrice = 1.2500
  if (symbol.includes('JPY')) currentPrice = 110.00
  if (symbol.includes('AUD')) currentPrice = 0.7500
  if (symbol.includes('CAD')) currentPrice = 1.3500
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * getIntervalMs(interval))
    
    // Generate realistic price movement
    const volatility = 0.001 // 0.1% volatility
    const change = (Math.random() - 0.5) * volatility * currentPrice
    currentPrice += change
    
    const spread = currentPrice * 0.00002 // 0.002% spread
    const high = currentPrice + Math.random() * spread * 2
    const low = currentPrice - Math.random() * spread * 2
    const open = i === count - 1 ? currentPrice : data[data.length - 1]?.close || currentPrice
    
    data.push({
      datetime: timestamp.toISOString(),
      timestamp: timestamp.toISOString(),
      open: parseFloat(open.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(currentPrice.toFixed(5)),
      volume: Math.floor(Math.random() * 1000000) + 100000
    })
  }
  
  return data.reverse() // Return chronological order
}

function getIntervalMs(interval: string): number {
  const intervals: { [key: string]: number } = {
    '1min': 60 * 1000,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '45min': 45 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '2h': 2 * 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1day': 24 * 60 * 60 * 1000,
    '1week': 7 * 24 * 60 * 60 * 1000,
    '1month': 30 * 24 * 60 * 60 * 1000
  }
  
  return intervals[interval] || intervals['5min']
}
