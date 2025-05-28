
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
    const { results, strategy } = await req.json()
    
    const analysis = analyzeStrategy(results, strategy)
    
    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Analysis error:', error)
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

function analyzeStrategy(results: any, strategy: any) {
  const { winRate, totalReturn, profitFactor, maxDrawdown, totalTrades } = results
  
  let overall_assessment = "Needs Improvement"
  let risk_level = "High"
  let recommendations = []
  
  // Assess overall performance
  if (winRate > 60 && totalReturn > 10 && profitFactor > 1.5 && maxDrawdown < 15) {
    overall_assessment = "Excellent"
    risk_level = "Low"
  } else if (winRate > 50 && totalReturn > 5 && profitFactor > 1.2 && maxDrawdown < 25) {
    overall_assessment = "Good"
    risk_level = "Medium"
  } else if (winRate > 40 && totalReturn > 0 && profitFactor > 1.0 && maxDrawdown < 35) {
    overall_assessment = "Fair"
    risk_level = "Medium-High"
  }
  
  // Generate recommendations
  if (winRate < 50) {
    recommendations.push("Consider tightening entry criteria to improve win rate")
    recommendations.push("Review and optimize your entry signals")
  }
  
  if (maxDrawdown > 20) {
    recommendations.push("Implement better risk management to reduce drawdown")
    recommendations.push("Consider reducing position sizes")
  }
  
  if (profitFactor < 1.2) {
    recommendations.push("Focus on improving profit factor by optimizing take profit levels")
    recommendations.push("Consider trailing stops to maximize winning trades")
  }
  
  if (totalTrades < 10) {
    recommendations.push("Run backtest on longer time period for more reliable results")
    recommendations.push("Consider using shorter timeframes to generate more trades")
  }
  
  // Strategy-specific recommendations
  if (strategy.name.toLowerCase().includes('ema') || strategy.name.toLowerCase().includes('moving average')) {
    recommendations.push("Consider adding volume or momentum filters to EMA crossover signals")
    recommendations.push("Test different EMA periods (e.g., 9/21 or 8/21)")
  }
  
  if (strategy.name.toLowerCase().includes('rsi')) {
    recommendations.push("Consider combining RSI with trend filters")
    recommendations.push("Test different RSI levels (e.g., 25/75 instead of 30/70)")
  }
  
  return {
    overall_assessment,
    risk_level,
    recommendations,
    strengths: generateStrengths(results),
    weaknesses: generateWeaknesses(results),
    optimization_suggestions: [
      "Test different timeframes to find optimal entry/exit timing",
      "Experiment with dynamic position sizing based on volatility",
      "Consider market session filters (e.g., only trade during active hours)",
      "Add fundamental analysis filters for major news events"
    ]
  }
}

function generateStrengths(results: any): string[] {
  const strengths = []
  
  if (results.winRate > 55) strengths.push(`Strong win rate of ${results.winRate.toFixed(1)}%`)
  if (results.totalReturn > 10) strengths.push(`Excellent total return of ${results.totalReturn.toFixed(1)}%`)
  if (results.profitFactor > 1.5) strengths.push(`Good profit factor of ${results.profitFactor.toFixed(2)}`)
  if (results.maxDrawdown < 15) strengths.push(`Low maximum drawdown of ${results.maxDrawdown.toFixed(1)}%`)
  if (results.totalTrades > 50) strengths.push(`Sufficient trade sample size (${results.totalTrades} trades)`)
  
  return strengths.length > 0 ? strengths : ["Strategy shows potential for improvement"]
}

function generateWeaknesses(results: any): string[] {
  const weaknesses = []
  
  if (results.winRate < 45) weaknesses.push(`Low win rate of ${results.winRate.toFixed(1)}%`)
  if (results.totalReturn < 0) weaknesses.push(`Negative total return of ${results.totalReturn.toFixed(1)}%`)
  if (results.profitFactor < 1.1) weaknesses.push(`Poor profit factor of ${results.profitFactor.toFixed(2)}`)
  if (results.maxDrawdown > 25) weaknesses.push(`High maximum drawdown of ${results.maxDrawdown.toFixed(1)}%`)
  if (results.totalTrades < 10) weaknesses.push(`Insufficient trade sample size (${results.totalTrades} trades)`)
  
  return weaknesses.length > 0 ? weaknesses : ["Strategy shows good overall performance"]
}
