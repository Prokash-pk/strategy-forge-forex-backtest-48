
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface StrategyConfig {
  id: string
  strategy_name: string
  strategy_code: string
  symbol: string
  timeframe: string
  reverse_signals?: boolean
}

interface OANDAConfig {
  accountId: string
  apiKey: string
  environment: 'practice' | 'live'
  riskPerTrade?: number
  stopLoss?: number
  takeProfit?: number
  maxPositionSize?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, strategy, config }: { 
      action: string
      strategy: StrategyConfig
      config: OANDAConfig
    } = await req.json()

    console.log('Forward testing request:', { action, strategy: strategy.strategy_name, config: { accountId: config.accountId, environment: config.environment } })

    if (action === 'execute_now') {
      // Fetch live market data from OANDA
      const marketData = await fetchOANDAMarketData(config, strategy.symbol, strategy.timeframe)
      
      if (!marketData || marketData.candles.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch market data'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Execute strategy against live data
      const signal = await executeStrategy(strategy, marketData)
      
      if (signal.hasSignal) {
        console.log('📈 Signal detected:', signal.signalType, 'for', strategy.symbol)
        
        // Execute trade on OANDA
        const tradeResult = await executeOANDATrade(config, strategy, signal)
        
        return new Response(JSON.stringify({
          success: true,
          signal_detected: true,
          signal_type: signal.signalType,
          trade_executed: tradeResult.success,
          trade_result: tradeResult,
          current_price: signal.currentPrice
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        console.log('📊 No signal detected for', strategy.symbol)
        
        return new Response(JSON.stringify({
          success: true,
          signal_detected: false,
          current_price: marketData.candles[marketData.candles.length - 1]?.mid?.c || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Forward testing error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function fetchOANDAMarketData(config: OANDAConfig, symbol: string, timeframe: string) {
  try {
    // Convert symbol to OANDA format
    const oandaSymbol = symbol.includes('/') ? symbol.replace('/', '_') : symbol
    
    // Convert timeframe to OANDA format
    const oandaTimeframe = timeframe === '1m' ? 'M1' : 
                          timeframe === '5m' ? 'M5' : 
                          timeframe === '15m' ? 'M15' : 
                          timeframe === '1h' ? 'H1' : 
                          timeframe === '4h' ? 'H4' : 
                          timeframe === '1d' ? 'D' : 'M5'

    const baseUrl = config.environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com'

    const response = await fetch(
      `${baseUrl}/v3/instruments/${oandaSymbol}/candles?granularity=${oandaTimeframe}&count=100`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`OANDA API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching OANDA market data:', error)
    return null
  }
}

async function executeStrategy(strategy: StrategyConfig, marketData: any) {
  try {
    // Convert OANDA candle data to arrays for strategy execution
    const candles = marketData.candles || []
    
    const close = candles.map((candle: any) => parseFloat(candle.mid?.c || 0))
    const high = candles.map((candle: any) => parseFloat(candle.mid?.h || 0))
    const low = candles.map((candle: any) => parseFloat(candle.mid?.l || 0))
    const open = candles.map((candle: any) => parseFloat(candle.mid?.o || 0))
    const volume = candles.map((candle: any) => parseFloat(candle.volume || 1000))

    // Simple EMA crossover strategy implementation
    const emaShort = calculateEMA(close, 12)
    const emaLong = calculateEMA(close, 26)
    
    const currentPrice = close[close.length - 1]
    const prevEmaShort = emaShort[emaShort.length - 2]
    const prevEmaLong = emaLong[emaLong.length - 2]
    const currentEmaShort = emaShort[emaShort.length - 1]
    const currentEmaLong = emaLong[emaLong.length - 1]

    // Detect crossover signals
    let signalType = null
    let hasSignal = false

    if (prevEmaShort <= prevEmaLong && currentEmaShort > currentEmaLong) {
      // Bullish crossover
      signalType = strategy.reverse_signals ? 'SELL' : 'BUY'
      hasSignal = true
    } else if (prevEmaShort >= prevEmaLong && currentEmaShort < currentEmaLong) {
      // Bearish crossover  
      signalType = strategy.reverse_signals ? 'BUY' : 'SELL'
      hasSignal = true
    }

    return {
      hasSignal,
      signalType,
      currentPrice,
      emaShort: currentEmaShort,
      emaLong: currentEmaLong
    }
  } catch (error) {
    console.error('Strategy execution error:', error)
    return { hasSignal: false, signalType: null, currentPrice: 0 }
  }
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema = []
  const multiplier = 2 / (period + 1)
  
  // Start with SMA for first value
  let sum = 0
  for (let i = 0; i < period && i < prices.length; i++) {
    sum += prices[i]
  }
  ema[period - 1] = sum / period
  
  // Calculate EMA for remaining values
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier))
  }
  
  return ema
}

async function executeOANDATrade(config: OANDAConfig, strategy: StrategyConfig, signal: any) {
  try {
    const units = config.maxPositionSize || 10000
    const adjustedUnits = signal.signalType === 'BUY' ? units : -units

    // Calculate stop loss and take profit
    const stopLossDistance = (config.stopLoss || 40) * 0.0001 // 40 pips default
    const takeProfitDistance = (config.takeProfit || 80) * 0.0001 // 80 pips default
    
    let stopLossPrice, takeProfitPrice
    if (signal.signalType === 'BUY') {
      stopLossPrice = (signal.currentPrice - stopLossDistance).toFixed(5)
      takeProfitPrice = (signal.currentPrice + takeProfitDistance).toFixed(5)
    } else {
      stopLossPrice = (signal.currentPrice + stopLossDistance).toFixed(5)
      takeProfitPrice = (signal.currentPrice - takeProfitDistance).toFixed(5)
    }

    // Execute trade via OANDA trade executor
    const tradeSignal = {
      action: signal.signalType,
      symbol: strategy.symbol,
      units: Math.abs(adjustedUnits),
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      strategyId: strategy.id,
      userId: 'system'
    }

    const baseUrl = config.environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com'

    const orderData = {
      order: {
        type: 'MARKET',
        instrument: strategy.symbol.replace('/', '_'),
        units: adjustedUnits.toString(),
        timeInForce: 'FOK',
        positionFill: 'DEFAULT',
        stopLossOnFill: {
          price: stopLossPrice,
          timeInForce: 'GTC'
        },
        takeProfitOnFill: {
          price: takeProfitPrice,
          timeInForce: 'GTC'
        }
      }
    }

    const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Trade executed successfully:', result.orderCreateTransaction?.id)
      return {
        success: true,
        orderId: result.orderCreateTransaction?.id,
        fillPrice: result.orderFillTransaction?.price || signal.currentPrice
      }
    } else {
      console.error('❌ Trade execution failed:', result)
      return {
        success: false,
        error: result.errorMessage || 'Trade execution failed'
      }
    }
  } catch (error) {
    console.error('Trade execution error:', error)
    return {
      success: false,
      error: error.message || 'Unknown trade execution error'
    }
  }
}
