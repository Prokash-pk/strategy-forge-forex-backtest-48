
import { AIAnalysisApiService } from './aiStrategyCoach/apiService';
import { FallbackAnalyzer } from './aiStrategyCoach/fallbackAnalyzer';

// Re-export types for backward compatibility
export type { AIStrategyRecommendation, AIStrategyAnalysis } from './aiStrategyCoach/types';

export class AIStrategyCoach {
  static async analyzeStrategyWithAI(
    strategyCode: string, 
    backtestResults: any,
    marketData?: any
  ): Promise<import('./aiStrategyCoach/types').AIStrategyAnalysis> {
    try {
      return await AIAnalysisApiService.callAnalysisAPI(
        strategyCode,
        backtestResults,
        marketData
      );
    } catch (error) {
      console.error('AI strategy analysis failed:', error);
      
      // Fallback to enhanced rule-based analysis if AI fails
      console.log('Falling back to enhanced rule-based analysis...');
      return FallbackAnalyzer.performEnhancedFallbackAnalysis(strategyCode, backtestResults);
    }
  }
}
