
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { natural_language } = await req.json();

    if (!natural_language || typeof natural_language !== 'string') {
      throw new Error('Natural language description is required');
    }

    const systemPrompt = `You are an expert trading strategy developer. Convert natural language trading descriptions into Python code that follows this exact format:

def strategy_logic(data):
    # Your code here using TechnicalAnalysis helper functions
    # Available functions: ema(), sma(), rsi(), bollinger_bands(), macd()
    # data is a DataFrame with columns: Open, High, Low, Close, Volume
    
    # Return format must be:
    return {
        'entry': [list of boolean values for entry signals],
        'exit': [list of boolean values for exit signals],
        'indicator_name': [optional: list of indicator values for plotting]
    }

Key requirements:
1. Use only the TechnicalAnalysis helper functions provided
2. Return boolean lists for entry/exit that match the data length
3. Handle edge cases (first few bars where indicators may be undefined)
4. Include comments explaining the logic
5. Add any calculated indicators to the return dict for plotting

Available TechnicalAnalysis functions:
- TechnicalAnalysis.ema(prices, period)
- TechnicalAnalysis.sma(prices, period)  
- TechnicalAnalysis.rsi(prices, period)
- TechnicalAnalysis.bollinger_bands(prices, period, std_dev)
- TechnicalAnalysis.macd(prices, fast=12, slow=26, signal=9)

Example for "Buy when RSI below 30, sell when RSI above 70":

def strategy_logic(data):
    # Calculate RSI with 14-period
    rsi = TechnicalAnalysis.rsi(data['Close'].tolist(), 14)
    
    # Generate entry and exit signals
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i < 14:  # Not enough data for RSI
            entry.append(False)
            exit.append(False)
        else:
            # Entry: RSI below 30 (oversold)
            entry.append(rsi[i] < 30)
            # Exit: RSI above 70 (overbought)  
            exit.append(rsi[i] > 70)
    
    return {
        'entry': entry,
        'exit': exit,
        'rsi': rsi
    }

Convert the following strategy description to Python code:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: natural_language }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedCode = data.choices[0].message.content;

    // Clean up the response to extract just the Python function
    let pythonCode = generatedCode;
    
    // Remove markdown code blocks if present
    pythonCode = pythonCode.replace(/```python\s*/g, '').replace(/```\s*/g, '');
    
    // Ensure it starts with def strategy_logic
    if (!pythonCode.includes('def strategy_logic')) {
      throw new Error('Generated code does not contain strategy_logic function');
    }

    return new Response(JSON.stringify({ 
      success: true,
      python_code: pythonCode.trim(),
      original_description: natural_language
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Strategy translation error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
