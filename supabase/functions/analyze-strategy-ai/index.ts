
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

    const { strategy_code, backtest_results, market_data } = await req.json();

    if (!strategy_code || !backtest_results) {
      throw new Error('Strategy code and backtest results are required');
    }

    const systemPrompt = `You are an expert quantitative trading analyst and strategy developer. Analyze the provided Python trading strategy code and its backtest results to provide intelligent, actionable recommendations.

Your analysis should be thorough and practical, focusing on:
1. Code quality and logic flaws
2. Risk management issues
3. Entry/exit timing problems
4. Market condition adaptability
5. Position sizing optimization

Return your analysis in this exact JSON format:

{
  "overall_assessment": "Brief overall assessment of the strategy's performance and potential",
  "strengths_identified": ["Array of specific strengths found in the strategy"],
  "weaknesses_identified": ["Array of specific weaknesses and issues"],
  "market_condition_analysis": "Analysis of how the strategy performs in different market conditions",
  "risk_level": "low|medium|high",
  "complexity_score": number_between_0_and_100,
  "market_suitability": ["Array of market conditions where this strategy works best"],
  "recommendations": [
    {
      "id": "unique_id",
      "title": "Short descriptive title",
      "description": "Brief description of the recommendation", 
      "category": "risk_management|entry_timing|exit_strategy|position_sizing|market_analysis",
      "priority": "high|medium|low",
      "estimated_improvement": number_percentage_improvement,
      "confidence": number_between_0_and_100,
      "reasoning": "Detailed AI reasoning for this recommendation",
      "code_snippet": "Python code that implements this improvement (if applicable)",
      "explanation": "Clear explanation of what this code does and why it helps"
    }
  ]
}

Focus on providing actionable Python code snippets that can be integrated into the strategy_logic function. Make recommendations specific to the actual issues you see in the code and results.`;

    const userPrompt = `Please analyze this trading strategy:

STRATEGY CODE:
${strategy_code}

BACKTEST RESULTS:
- Win Rate: ${backtest_results.winRate}%
- Total Trades: ${backtest_results.totalTrades}
- Profit Factor: ${backtest_results.profitFactor}
- Max Drawdown: ${backtest_results.maxDrawdown}%
- Total Return: ${backtest_results.totalReturn}%
- Sharpe Ratio: ${backtest_results.sharpeRatio || 'N/A'}

${backtest_results.trades ? `SAMPLE TRADES (first 10):
${JSON.stringify(backtest_results.trades.slice(0, 10), null, 2)}` : ''}

Provide a comprehensive AI analysis with specific, actionable recommendations for improvement.`;

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    // Parse the JSON response
    let analysis;
    try {
      // Extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(analysisText);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Validate and ensure required fields
    const validatedAnalysis = {
      overall_assessment: analysis.overall_assessment || 'Analysis completed',
      strengths_identified: Array.isArray(analysis.strengths_identified) ? analysis.strengths_identified : ['Strategy executes without errors'],
      weaknesses_identified: Array.isArray(analysis.weaknesses_identified) ? analysis.weaknesses_identified : ['No specific issues identified'],
      market_condition_analysis: analysis.market_condition_analysis || 'Market analysis unavailable',
      risk_level: ['low', 'medium', 'high'].includes(analysis.risk_level) ? analysis.risk_level : 'medium',
      complexity_score: typeof analysis.complexity_score === 'number' ? Math.min(100, Math.max(0, analysis.complexity_score)) : 50,
      market_suitability: Array.isArray(analysis.market_suitability) ? analysis.market_suitability : ['General Market Conditions'],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.map((rec: any, index: number) => ({
        id: rec.id || `ai_rec_${index}`,
        title: rec.title || 'Strategy Improvement',
        description: rec.description || 'AI-generated recommendation',
        category: ['risk_management', 'entry_timing', 'exit_strategy', 'position_sizing', 'market_analysis'].includes(rec.category) 
          ? rec.category : 'market_analysis',
        priority: ['high', 'medium', 'low'].includes(rec.priority) ? rec.priority : 'medium',
        estimatedImprovement: typeof rec.estimated_improvement === 'number' ? rec.estimated_improvement : 0,
        confidence: typeof rec.confidence === 'number' ? Math.min(100, Math.max(0, rec.confidence)) : 75,
        reasoning: rec.reasoning || 'AI-generated reasoning',
        codeSnippet: rec.code_snippet || null,
        explanation: rec.explanation || 'AI-generated explanation'
      })) : []
    };

    return new Response(JSON.stringify({ 
      success: true,
      analysis: validatedAnalysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI strategy analysis error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
