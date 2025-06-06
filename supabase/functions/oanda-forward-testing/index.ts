
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

interface StrategySignal {
  signal: 'BUY' | 'SELL' | 'CLOSE' | 'NONE'
  confidence: number
  currentPrice: number
  emaShort: number
  emaLong: number
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

    console.log('🚀 REAL Forward testing request:', { action, strategy: strategy.strategy_name, config: { accountId: config.accountId, environment: config.environment } })

    if (action === 'execute_now') {
      // Step 1: Fetch live market data from OANDA
      console.log('📊 Fetching live market data...')
      const marketData = await fetchOANDAMarketData(config, strategy.symbol, strategy.timeframe)
      
      if (!marketData || marketData.candles.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch live market data from OANDA'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Step 2: Execute strategy against live data
      console.log('🧠 Executing strategy against live data...')
      const signal = await executeStrategyAgainstLiveData(strategy, marketData)
      
      console.log('📈 Strategy signal generated:', signal)

      if (signal.signal !== 'NONE' && signal.confidence >= 70) {
        console.log('✅ High confidence signal detected - executing REAL trade')
        
        // Step 3: Execute REAL trade on OANDA
        const tradeResult = await executeRealOANDATrade(config, strategy, signal)
        
        if (tradeResult.success) {
          console.log('🎉 REAL TRADE EXECUTED SUCCESSFULLY:', tradeResult.tradeId)
          
          return new Response(JSON.stringify({
            success: true,
            signal_detected: true,
            signal_type: signal.signal,
            trade_executed: true,
            trade_result: tradeResult,
            current_price: signal.currentPrice,
            confidence: signal.confidence,
            execution_type: 'REAL_TRADE'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } else {
          console.error('❌ REAL TRADE EXECUTION FAILED:', tradeResult.error)
          
          return new Response(JSON.stringify({
            success: false,
            signal_detected: true,
            signal_type: signal.signal,
            trade_executed: false,
            error: tradeResult.error,
            current_price: signal.currentPrice,
            confidence: signal.confidence,
            execution_type: 'REAL_TRADE_FAILED'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } else {
        console.log(`📊 Signal confidence ${signal.confidence}% below 70% threshold or no signal - no trade executed`)
        
        return new Response(JSON.stringify({
          success: true,
          signal_detected: signal.signal !== 'NONE',
          signal_type: signal.signal,
          trade_executed: false,
          reason: signal.signal === 'NONE' ? 'No signal detected' : `Confidence ${signal.confidence}% below 70% threshold`,
          current_price: signal.currentPrice,
          confidence: signal.confidence,
          execution_type: 'NO_TRADE'
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
    console.error('❌ Forward testing error:', error)
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

    console.log(`📊 Fetching ${oandaSymbol} ${oandaTimeframe} data from OANDA...`)

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
    console.log(`✅ Received ${data.candles?.length || 0} candles from OANDA`)
    return data
  } catch (error) {
    console.error('❌ Error fetching OANDA market data:', error)
    return null
  }
}

async function executeStrategyAgainstLiveData(strategy: StrategyConfig, marketData: any): Promise<StrategySignal> {
  try {
    console.log('🧠 Executing strategy logic against live data...')
    
    // Convert OANDA candle data to arrays for strategy execution
    const candles = marketData.candles || []
    
    const close = candles.map((candle: any) => parseFloat(candle.mid?.c || 0))
    const high = candles.map((candle: any) => parseFloat(candle.mid?.h || 0))
    const low = candles.map((candle: any) => parseFloat(candle.mid?.l || 0))
    const open = candles.map((candle: any) => parseFloat(candle.mid?.o || 0))

    // Implement EMA crossover strategy (this should be replaced with actual Python strategy execution)
    const emaShort = calculateEMA(close, 12)
    const emaLong = calculateEMA(close, 26)
    
    const currentPrice = close[close.length - 1]
    const prevEmaShort = emaShort[emaShort.length - 2]
    const prevEmaLong = emaLong[emaLong.length - 2]
    const currentEmaShort = emaShort[emaShort.length - 1]
    const currentEmaLong = emaLong[emaLong.length - 1]

    // Calculate signal strength based on EMA separation
    const emaSeparation = Math.abs(currentEmaShort - currentEmaLong) / currentPrice
    const baseConfidence = Math.min(emaSeparation * 10000, 100) // Convert to percentage

    // Detect crossover signals
    let signal: 'BUY' | 'SELL' | 'NONE' = 'NONE'
    let confidence = 0

    if (prevEmaShort <= prevEmaLong && currentEmaShort > currentEmaLong) {
      // Bullish crossover
      signal = strategy.reverse_signals ? 'SELL' : 'BUY'
      confidence = Math.min(baseConfidence + 20, 95) // Boost confidence for crossover
    } else if (prevEmaShort >= prevEmaLong && currentEmaShort < currentEmaLong) {
      // Bearish crossover  
      signal = strategy.reverse_signals ? 'BUY' : 'SELL'
      confidence = Math.min(baseConfidence + 20, 95) // Boost confidence for crossover
    } else {
      // No crossover - check trend strength
      if (currentEmaShort > currentEmaLong) {
        signal = strategy.reverse_signals ? 'SELL' : 'BUY'
        confidence = Math.min(baseConfidence, 75) // Lower confidence for trend following
      } else if (currentEmaShort < currentEmaLong) {
        signal = strategy.reverse_signals ? 'BUY' : 'SELL'
        confidence = Math.min(baseConfidence, 75) // Lower confidence for trend following
      }
    }

    const result: StrategySignal = {
      signal,
      confidence: Math.round(confidence),
      currentPrice,
      emaShort: currentEmaShort,
      emaLong: currentEmaLong
    }

    console.log('📊 Strategy analysis complete:', result)
    return result
  } catch (error) {
    console.error('❌ Strategy execution error:', error)
    return { 
      signal: 'NONE', 
      confidence: 0, 
      currentPrice: 0, 
      emaShort: 0, 
      emaLong: 0 
    }
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

async function executeRealOANDATrade(config: OANDAConfig, strategy: StrategyConfig, signal: StrategySignal) {
  try {
    console.log('🚀 Executing REAL OANDA trade...')
    
    // Calculate position size based on risk management
    const accountInfo = await getAccountInfo(config)
    if (!accountInfo) {
      throw new Error('Unable to fetch account information')
    }

    const riskAmount = accountInfo.balance * ((config.riskPerTrade || 2) / 100)
    const stopLossDistance = signal.currentPrice * 0.01 // 1% stop loss
    const positionSize = Math.min(
      Math.floor(riskAmount / stopLossDistance),
      config.maxPositionSize || 10000
    )

    if (positionSize < 100) {
      throw new Error('Calculated position size too small for viable trade')
    }

    // Calculate stop loss and take profit
    const stopLossDistance_pips = (config.stopLoss || 40) * 0.0001
    const takeProfitDistance_pips = (config.takeProfit || 80) * 0.0001
    
    let stopLossPrice, takeProfitPrice
    if (signal.signal === 'BUY') {
      stopLossPrice = (signal.currentPrice - stopLossDistance_pips).toFixed(5)
      takeProfitPrice = (signal.currentPrice + takeProfitDistance_pips).toFixed(5)
    } else {
      stopLossPrice = (signal.currentPrice + stopLossDistance_pips).toFixed(5)
      takeProfitPrice = (signal.currentPrice - takeProfitDistance_pips).toFixed(5)
    }

    const baseUrl = config.environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com'

    const adjustedUnits = signal.signal === 'BUY' ? positionSize : -positionSize

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

    console.log('📤 Sending REAL order to OANDA:', JSON.stringify(orderData, null, 2))

    const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })

    const result = await response.json()
    console.log('📥 OANDA REAL trade response:', JSON.stringify(result, null, 2))
    
    if (response.ok && result.orderCreateTransaction) {
      console.log('✅ REAL TRADE EXECUTED - Order ID:', result.orderCreateTransaction.id)
      
      return {
        success: true,
        orderId: result.orderCreateTransaction.id,
        tradeId: result.orderFillTransaction?.id,
        fillPrice: result.orderFillTransaction?.price || signal.currentPrice,
        positionSize: positionSize,
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice
      }
    } else {
      console.error('❌ REAL TRADE FAILED:', result)
      return {
        success: false,
        error: result.errorMessage || 'Trade execution failed'
      }
    }
  } catch (error) {
    console.error('❌ REAL trade execution error:', error)
    return {
      success: false,
      error: error.message || 'Unknown trade execution error'
    }
  }
}

async function getAccountInfo(config: OANDAConfig) {
  try {
    const baseUrl = config.environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com'

    const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Account info fetch failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      balance: parseFloat(data.account.balance),
      unrealizedPL: parseFloat(data.account.unrealizedPL),
      openPositionCount: parseInt(data.account.openPositionCount)
    }
  } catch (error) {
    console.error('Error fetching account info:', error)
    return null
  }
}
