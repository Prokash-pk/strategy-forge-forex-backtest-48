
import { supabase } from '@/integrations/supabase/client';
import type { AIStrategyAnalysis } from './types';

export class AIAnalysisApiService {
  static async callAnalysisAPI(
    strategyCode: string,
    backtestResults: any,
    marketData?: any
  ): Promise<AIStrategyAnalysis> {
    console.log('Starting OpenAI-powered strategy analysis...');
    
    const { data, error } = await supabase.functions.invoke('analyze-strategy-ai', {
      body: {
        strategy_code: strategyCode,
        backtest_results: backtestResults,
        market_data: marketData
      }
    });

    if (error) {
      console.error('AI analysis error:', error);
      throw new Error(error.message || 'AI analysis failed');
    }

    if (!data.success) {
      throw new Error(data.error || 'AI analysis failed');
    }

    const analysis = data.analysis;
    console.log('AI analysis completed successfully:', analysis);

    // Transform the response to match our interface
    return {
      overallAssessment: analysis.overall_assessment,
      strengthsIdentified: analysis.strengths_identified,
      weaknessesIdentified: analysis.weaknesses_identified,
      marketConditionAnalysis: analysis.market_condition_analysis,
      riskLevel: analysis.risk_level,
      complexityScore: analysis.complexity_score,
      marketSuitability: analysis.market_suitability,
      recommendations: analysis.recommendations
    };
  }
}
