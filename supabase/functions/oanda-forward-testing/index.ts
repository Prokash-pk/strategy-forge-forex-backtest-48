
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface TradingSession {
  id: string
  user_id: string
  strategy_id: string
  strategy_code: string
  symbol: string
  timeframe: string
  oanda_account_id: string
  oanda_api_key: string
  environment: 'practice' | 'live'
  risk_per_trade: number
  stop_loss: number
  take_profit: number
  max_position_size: number
  reverse_signals: boolean
  is_active: boolean
  last_execution: string
  created_at: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    const { action, session } = body

    if (req.method === 'POST') {
      // Start or stop a trading session
      
      if (action === 'start') {
        const { data, error } = await supabase
          .from('trading_sessions')
          .insert({
            user_id: session.user_id,
            strategy_id: session.strategy_id,
            strategy_code: session.strategy_code,
            symbol: session.symbol,
            timeframe: session.timeframe,
            oanda_account_id: session.oanda_account_id,
            oanda_api_key: session.oanda_api_key,
            environment: session.environment,
            risk_per_trade: session.risk_per_trade,
            stop_loss: session.stop_loss,
            take_profit: session.take_profit,
            max_position_size: session.max_position_size,
            reverse_signals: session.reverse_signals || false,
            is_active: true,
            last_execution: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          throw error
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Trading session started',
          session: data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (action === 'stop') {
        const { data, error } = await supabase
          .from('trading_sessions')
          .update({ is_active: false })
          .eq('user_id', session.user_id)
          .eq('strategy_id', session.strategy_id)

        if (error) {
          throw error
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Trading session stopped'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (action === 'test') {
        return new Response(JSON.stringify({
          success: true,
          message: 'Edge function is working correctly'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (req.method === 'GET') {
      // This will be called by cron to execute all active trading sessions
      console.log('Executing scheduled trading sessions...')

      // Get all active trading sessions
      const { data: sessions, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('is_active', true)

      if (error) {
        throw error
      }

      console.log(`Found ${sessions?.length || 0} active trading sessions`)

      // Execute each trading session
      for (const session of sessions || []) {
        try {
          await executeSession(session)
          
          // Update last execution time
          await supabase
            .from('trading_sessions')
            .update({ last_execution: new Date().toISOString() })
            .eq('id', session.id)

        } catch (error) {
          console.error(`Error executing session ${session.id}:`, error)
          
          // Log the error
          await supabase
            .from('trading_logs')
            .insert({
              session_id: session.id,
              user_id: session.user_id,
              log_type: 'error',
              message: error.message,
              timestamp: new Date().toISOString()
            })
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Executed ${sessions?.length || 0} trading sessions`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('Forward testing error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function executeSession(session: TradingSession) {
  console.log(`Executing session for user ${session.user_id}, strategy ${session.strategy_id}`)

  // Fetch live market data from OANDA
  const marketData = await fetchOANDAMarketData(session)
  
  if (!marketData) {
    console.log('No market data received, skipping execution')
    return
  }

  // Execute strategy logic
  const signals = executeStrategyLogic(session, marketData)

  // Process signals and execute trades
  for (const signal of signals) {
    await executeTrade(session, signal)
  }
}

async function fetchOANDAMarketData(session: TradingSession) {
  const baseUrl = session.environment === 'practice' 
    ? 'https://api-fxpractice.oanda.com'
    : 'https://api-fxtrade.oanda.com'

  // Convert symbol to OANDA format
  let oandaSymbol = session.symbol
  if (session.symbol.includes('=X')) {
    oandaSymbol = session.symbol.replace('=X', '').replace(/(.{3})(.{3})/, '$1_$2')
  } else if (session.symbol.length === 6 && !session.symbol.includes('_')) {
    oandaSymbol = session.symbol.replace(/(.{3})(.{3})/, '$1_$2')
  }

  const timeframeMap: Record<string, string> = {
    '1m': 'M1',
    '5m': 'M5',
    '15m': 'M15',
    '30m': 'M30',
    '1h': 'H1',
    '4h': 'H4',
    '1d': 'D',
    'daily': 'D'
  }

  const granularity = timeframeMap[session.timeframe] || 'H1'

  try {
    const response = await fetch(
      `${baseUrl}/v3/instruments/${oandaSymbol}/candles?count=100&granularity=${granularity}&price=MBA`,
      {
        headers: {
          'Authorization': `Bearer ${session.oanda_api_key}`,
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      throw new Error(`OANDA API Error: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Convert to our format
    const marketData = {
      open: [] as number[],
      high: [] as number[],
      low: [] as number[],
      close: [] as number[],
      volume: [] as number[]
    }

    data.candles.forEach((candle: any) => {
      const open = (parseFloat(candle.bid.o) + parseFloat(candle.ask.o)) / 2
      const high = (parseFloat(candle.bid.h) + parseFloat(candle.ask.h)) / 2
      const low = (parseFloat(candle.bid.l) + parseFloat(candle.ask.l)) / 2
      const close = (parseFloat(candle.bid.c) + parseFloat(candle.ask.c)) / 2

      marketData.open.push(open)
      marketData.high.push(high)
      marketData.low.push(low)
      marketData.close.push(close)
      marketData.volume.push(candle.volume)
    })

    return marketData
  } catch (error) {
    console.error('Failed to fetch OANDA market data:', error)
    return null
  }
}

function executeStrategyLogic(session: TradingSession, marketData: any) {
  // Simple momentum strategy implementation
  const close = marketData.close
  const signals = []

  if (close.length < 20) return signals

  // Simple EMA crossover strategy
  const ema9 = calculateEMA(close, 9)
  const ema21 = calculateEMA(close, 21)
  
  const lastIndex = close.length - 1
  const prevIndex = lastIndex - 1

  // Check for bullish crossover
  if (ema9[lastIndex] > ema21[lastIndex] && ema9[prevIndex] <= ema21[prevIndex]) {
    const action = session.reverse_signals ? 'SELL' : 'BUY'
    const currentPrice = close[lastIndex]
    const stopLossPips = session.stop_loss || 40
    const takeProfitPips = session.take_profit || 80
    const pipValue = 0.0001

    signals.push({
      action,
      symbol: session.symbol,
      units: calculatePositionSize(session),
      stopLoss: session.reverse_signals 
        ? (currentPrice + (stopLossPips * pipValue)).toFixed(5)
        : (currentPrice - (stopLossPips * pipValue)).toFixed(5),
      takeProfit: session.reverse_signals
        ? (currentPrice - (takeProfitPips * pipValue)).toFixed(5)
        : (currentPrice + (takeProfitPips * pipValue)).toFixed(5),
      currentPrice
    })
  }
  // Check for bearish crossover
  else if (ema9[lastIndex] < ema21[lastIndex] && ema9[prevIndex] >= ema21[prevIndex]) {
    const action = session.reverse_signals ? 'BUY' : 'SELL'
    const currentPrice = close[lastIndex]
    const stopLossPips = session.stop_loss || 40
    const takeProfitPips = session.take_profit || 80
    const pipValue = 0.0001

    signals.push({
      action,
      symbol: session.symbol,
      units: calculatePositionSize(session),
      stopLoss: session.reverse_signals 
        ? (currentPrice - (stopLossPips * pipValue)).toFixed(5)
        : (currentPrice + (stopLossPips * pipValue)).toFixed(5),
      takeProfit: session.reverse_signals
        ? (currentPrice + (takeProfitPips * pipValue)).toFixed(5)
        : (currentPrice - (takeProfitPips * pipValue)).toFixed(5),
      currentPrice
    })
  }

  return signals
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema = []
  const multiplier = 2 / (period + 1)
  
  // First EMA is just the simple average
  let sum = 0
  for (let i = 0; i < period && i < prices.length; i++) {
    sum += prices[i]
  }
  ema[period - 1] = sum / period

  // Calculate EMA for the rest
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier))
  }

  return ema
}

function calculatePositionSize(session: TradingSession): number {
  const riskAmount = (10000 * session.risk_per_trade) / 100 // Assuming 10k account
  const stopLossPips = session.stop_loss || 40
  const positionSize = Math.floor(riskAmount / stopLossPips)
  
  return Math.min(Math.max(positionSize, 100), session.max_position_size || 100000)
}

async function executeTrade(session: TradingSession, signal: any) {
  console.log('Executing trade signal:', signal)

  // Convert symbol to OANDA format
  let oandaSymbol = signal.symbol
  if (signal.symbol.includes('=X')) {
    oandaSymbol = signal.symbol.replace('=X', '').replace(/(.{3})(.{3})/, '$1_$2')
  } else if (signal.symbol.length === 6 && !signal.symbol.includes('_')) {
    oandaSymbol = signal.symbol.replace(/(.{3})(.{3})/, '$1_$2')
  }

  const baseUrl = session.environment === 'practice' 
    ? 'https://api-fxpractice.oanda.com'
    : 'https://api-fxtrade.oanda.com'

  const orderData = {
    order: {
      type: 'MARKET',
      instrument: oandaSymbol,
      units: signal.action === 'BUY' ? signal.units.toString() : (-signal.units).toString(),
      timeInForce: 'FOK',
      positionFill: 'DEFAULT',
      stopLossOnFill: {
        price: signal.stopLoss,
        timeInForce: 'GTC'
      },
      takeProfitOnFill: {
        price: signal.takeProfit,
        timeInForce: 'GTC'
      }
    }
  }

  try {
    const response = await fetch(
      `${baseUrl}/v3/accounts/${session.oanda_account_id}/orders`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.oanda_api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      }
    )

    const result = await response.json()
    console.log('Trade execution result:', result)

    // Log the trade
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('trading_logs')
      .insert({
        session_id: session.id,
        user_id: session.user_id,
        log_type: 'trade',
        message: `${signal.action} ${signal.units} units of ${oandaSymbol}`,
        trade_data: {
          signal,
          result,
          success: response.ok
        },
        timestamp: new Date().toISOString()
      })

  } catch (error) {
    console.error('Trade execution error:', error)
    throw error
  }
}
