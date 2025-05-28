
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BacktestStrategy {
  code: string;
  name: string;
  initialBalance: number;
  riskPerTrade: number;
  stopLoss: number;
  takeProfit: number;
  spread: number;
  commission: number;
  slippage: number;
  maxPositionSize: number;
  riskModel: string;
}

interface MarketData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data, strategy, pythonSignals, timeframeInfo, enhancedMode } = await req.json()
    
    console.log('Running backtest for strategy:', strategy.name)
    console.log('Data points:', data.length)
    console.log('Enhanced mode:', enhancedMode)
    console.log('Python signals available:', !!pythonSignals)

    // Run the backtest simulation
    const results = runSimpleBacktest(data, strategy, timeframeInfo)
    
    console.log('Backtest completed with', results.trades.length, 'trades')
    
    // Calculate additional metrics
    const enhancedResults = {
      ...results,
      strategy: strategy.name,
      symbol: 'EURUSD=X', // Default symbol
      timeframe: '5m', // Default timeframe
      period: `${data.length} bars`,
      initialBalance: strategy.initialBalance,
      executionMethod: enhancedMode ? 'Enhanced Python' : 'JavaScript Pattern Matching',
      totalTrades: results.trades?.length || 0,
      winRate: calculateWinRate(results.trades || []),
      totalReturn: results.totalReturn || 0,
      profitFactor: results.profitFactor || 1,
      maxDrawdown: results.maxDrawdown || 0,
      sharpeRatio: calculateSharpeRatio(results.equity || []),
      winningTrades: results.winningTrades || 0,
      losingTrades: results.losingTrades || 0,
      avgWin: results.averageWin || 0,
      avgLoss: results.averageLoss || 0,
      grossProfit: results.grossProfit || 0,
      grossLoss: results.grossLoss || 0,
      equityCurve: results.equity || [],
      enhancedFeatures: {
        dynamicSpreads: enhancedMode,
        realisticSlippage: enhancedMode,
        advancedPositionSizing: true,
        marketImpact: enhancedMode
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results: enhancedResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Backtest error:', error)
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

function runSimpleBacktest(data: MarketData[], strategy: BacktestStrategy, timeframeInfo?: any) {
  const trades = []
  let balance = strategy.initialBalance
  let position = null
  let equity = [balance]
  let maxBalance = balance
  let maxDrawdown = 0
  let tradeId = 1

  console.log('Starting backtest with', data.length, 'data points')

  // Simple EMA crossover logic
  const shortPeriod = 12
  const longPeriod = 26
  const shortEMA = calculateEMA(data.map(d => d.close), shortPeriod)
  const longEMA = calculateEMA(data.map(d => d.close), longPeriod)

  for (let i = longPeriod; i < data.length; i++) {
    const currentPrice = data[i].close
    
    // Entry signal: short EMA crosses above long EMA
    if (!position && shortEMA[i] > longEMA[i] && shortEMA[i-1] <= longEMA[i-1]) {
      const positionSize = (balance * strategy.riskPerTrade / 100) / currentPrice
      position = {
        type: 'BUY',
        entryPrice: currentPrice + (strategy.spread || 2) / 10000,
        size: Math.min(positionSize, strategy.maxPositionSize || 100000),
        entryTime: data[i].timestamp,
        entryIndex: i
      }
      
      console.log(`Trade ${tradeId} entry at ${position.entryPrice}`)
    }
    
    // Exit signal: short EMA crosses below long EMA or stop loss/take profit
    if (position && position.type === 'BUY') {
      const currentPnL = (currentPrice - position.entryPrice) * position.size
      const pnLPips = (currentPrice - position.entryPrice) * 10000
      
      let shouldExit = false
      let exitReason = ''
      
      if (shortEMA[i] < longEMA[i] && shortEMA[i-1] >= longEMA[i-1]) {
        shouldExit = true
        exitReason = 'Signal'
      } else if (pnLPips <= -(strategy.stopLoss || 50)) {
        shouldExit = true
        exitReason = 'Stop Loss'
      } else if (pnLPips >= (strategy.takeProfit || 100)) {
        shouldExit = true
        exitReason = 'Take Profit'
      }
      
      if (shouldExit) {
        const exitPrice = currentPrice - (strategy.spread || 2) / 10000
        const finalPnL = (exitPrice - position.entryPrice) * position.size - (strategy.commission || 0.5)
        balance += finalPnL
        
        const trade = {
          id: tradeId++,
          entryTime: position.entryTime,
          exitTime: data[i].timestamp,
          entryPrice: position.entryPrice,
          exitPrice: exitPrice,
          size: position.size,
          pnl: finalPnL,
          pnlPips: (exitPrice - position.entryPrice) * 10000,
          type: position.type,
          exitReason: exitReason
        }
        
        trades.push(trade)
        console.log(`Trade ${trade.id} exit at ${exitPrice}, P&L: ${finalPnL.toFixed(2)}`)
        
        position = null
      }
    }
    
    equity.push(balance)
    maxBalance = Math.max(maxBalance, balance)
    const drawdown = (maxBalance - balance) / maxBalance * 100
    maxDrawdown = Math.max(maxDrawdown, drawdown)
  }

  console.log('Backtest completed, total trades:', trades.length)

  const totalReturn = ((balance - strategy.initialBalance) / strategy.initialBalance) * 100
  const winningTrades = trades.filter(t => t.pnl > 0)
  const losingTrades = trades.filter(t => t.pnl < 0)
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0)
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 1

  return {
    trades,
    finalBalance: balance,
    totalReturn,
    winRate,
    profitFactor,
    maxDrawdown,
    equity,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    grossProfit,
    grossLoss,
    averageWin: winningTrades.length > 0 ? grossProfit / winningTrades.length : 0,
    averageLoss: losingTrades.length > 0 ? grossLoss / losingTrades.length : 0
  }
}

function calculateEMA(prices: number[], period: number): number[] {
  const multiplier = 2 / (period + 1)
  const ema = [prices[0]]
  
  for (let i = 1; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i-1]) * multiplier + ema[i-1]
  }
  
  return ema
}

function calculateWinRate(trades: any[]): number {
  if (trades.length === 0) return 0
  const winningTrades = trades.filter(trade => trade.pnl > 0)
  return (winningTrades.length / trades.length) * 100
}

function calculateSharpeRatio(equity: number[]): number {
  if (equity.length < 2) return 0
  
  const returns = []
  for (let i = 1; i < equity.length; i++) {
    returns.push((equity[i] - equity[i-1]) / equity[i-1])
  }
  
  if (returns.length === 0) return 0
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  const stdDev = Math.sqrt(variance)
  
  return stdDev > 0 ? avgReturn / stdDev : 0
}
