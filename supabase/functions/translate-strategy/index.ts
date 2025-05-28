
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
    const { description } = await req.json()
    
    // Simple strategy translation based on keywords
    const pythonCode = translateDescriptionToPython(description)
    
    return new Response(
      JSON.stringify({
        success: true,
        strategy_code: pythonCode,
        strategy_name: extractStrategyName(description)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Translation error:', error)
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

function translateDescriptionToPython(description: string): string {
  const lowerDesc = description.toLowerCase()
  
  // RSI Strategy
  if (lowerDesc.includes('rsi') || lowerDesc.includes('relative strength')) {
    return `# RSI Strategy
# Buy when RSI is oversold (below 30), sell when overbought (above 70)

def strategy_logic(data):
    rsi = TechnicalAnalysis.rsi(data['Close'].tolist(), 14)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i == 0:
            entry.append(False)
            exit.append(False)
        else:
            # Entry: RSI oversold
            entry_signal = rsi[i] < 30 and rsi[i-1] >= 30
            # Exit: RSI overbought
            exit_signal = rsi[i] > 70 and rsi[i-1] <= 70
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'rsi': rsi
    }`
  }
  
  // MACD Strategy
  if (lowerDesc.includes('macd')) {
    return `# MACD Strategy
# Buy when MACD line crosses above signal line, sell when crosses below

def strategy_logic(data):
    macd_line, signal_line, histogram = TechnicalAnalysis.macd(data['Close'].tolist())
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i == 0:
            entry.append(False)
            exit.append(False)
        else:
            # Entry: MACD crosses above signal
            entry_signal = macd_line[i] > signal_line[i] and macd_line[i-1] <= signal_line[i-1]
            # Exit: MACD crosses below signal
            exit_signal = macd_line[i] < signal_line[i] and macd_line[i-1] >= signal_line[i-1]
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'macd': macd_line,
        'signal': signal_line,
        'histogram': histogram
    }`
  }
  
  // Bollinger Bands Strategy
  if (lowerDesc.includes('bollinger') || lowerDesc.includes('band')) {
    return `# Bollinger Bands Strategy
# Buy when price touches lower band, sell when touches upper band

def strategy_logic(data):
    bb_upper, bb_middle, bb_lower = TechnicalAnalysis.bollinger_bands(data['Close'].tolist(), 20, 2)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i == 0:
            entry.append(False)
            exit.append(False)
        else:
            # Entry: Price touches lower band
            entry_signal = data['Close'][i] <= bb_lower[i] and data['Close'][i-1] > bb_lower[i-1]
            # Exit: Price touches upper band
            exit_signal = data['Close'][i] >= bb_upper[i] and data['Close'][i-1] < bb_upper[i-1]
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'bb_upper': bb_upper,
        'bb_middle': bb_middle,
        'bb_lower': bb_lower
    }`
  }
  
  // Default EMA Crossover Strategy
  return `# EMA Crossover Strategy
# Buy when fast EMA crosses above slow EMA, sell when crosses below

def strategy_logic(data):
    fast_ema = TechnicalAnalysis.ema(data['Close'].tolist(), 12)
    slow_ema = TechnicalAnalysis.ema(data['Close'].tolist(), 26)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i == 0:
            entry.append(False)
            exit.append(False)
        else:
            # Entry: Fast EMA crosses above slow EMA
            entry_signal = fast_ema[i] > slow_ema[i] and fast_ema[i-1] <= slow_ema[i-1]
            # Exit: Fast EMA crosses below slow EMA
            exit_signal = fast_ema[i] < slow_ema[i] and fast_ema[i-1] >= slow_ema[i-1]
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'fast_ema': fast_ema,
        'slow_ema': slow_ema
    }`
}

function extractStrategyName(description: string): string {
  const lowerDesc = description.toLowerCase()
  
  if (lowerDesc.includes('rsi')) return 'RSI Strategy'
  if (lowerDesc.includes('macd')) return 'MACD Strategy'
  if (lowerDesc.includes('bollinger')) return 'Bollinger Bands Strategy'
  if (lowerDesc.includes('moving average') || lowerDesc.includes('ema') || lowerDesc.includes('sma')) return 'Moving Average Strategy'
  
  return 'Custom Strategy'
}
