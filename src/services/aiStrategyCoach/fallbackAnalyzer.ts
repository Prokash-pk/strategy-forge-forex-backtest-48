
import type { AIStrategyAnalysis, CodeAnalysis, PerformanceAnalysis } from './types';
import { CodeAnalyzer } from './codeAnalyzer';
import { PerformanceAnalyzer } from './performanceAnalyzer';
import { RecommendationGenerator } from './recommendationGenerator';

export class FallbackAnalyzer {
  static performEnhancedFallbackAnalysis(
    strategyCode: string, 
    results: any
  ): AIStrategyAnalysis {
    console.log('Performing enhanced fallback analysis...');
    
    const codeAnalysis = CodeAnalyzer.analyzeStrategyCode(strategyCode);
    const performanceAnalysis = PerformanceAnalyzer.analyzePerformancePatterns(results);
    
    const recommendations = RecommendationGenerator.generateEnhancedRecommendations(
      codeAnalysis,
      performanceAnalysis
    );

    return {
      overallAssessment: this.generateOverallAssessment(codeAnalysis, performanceAnalysis),
      strengthsIdentified: this.identifyStrengths(codeAnalysis, performanceAnalysis),
      weaknessesIdentified: this.identifyWeaknesses(codeAnalysis, performanceAnalysis),
      marketConditionAnalysis: 'Advanced rule-based analysis - upgrade to AI for deeper insights',
      recommendations,
      riskLevel: this.assessRiskLevel(results, codeAnalysis),
      complexityScore: codeAnalysis.complexity,
      marketSuitability: this.identifyMarketSuitability(codeAnalysis)
    };
  }

  private static generateOverallAssessment(codeAnalysis: CodeAnalysis, performanceAnalysis: PerformanceAnalysis): string {
    if (performanceAnalysis.winRateCategory === 'high' && performanceAnalysis.profitFactorCategory === 'excellent') {
      return `Your ${codeAnalysis.strategyType} shows excellent performance with strong metrics.`;
    }
    return `Your ${codeAnalysis.strategyType} has room for improvement in risk management and signal quality.`;
  }

  private static identifyStrengths(codeAnalysis: CodeAnalysis, performanceAnalysis: PerformanceAnalysis): string[] {
    const strengths = [];
    if (performanceAnalysis.winRateCategory === 'high') strengths.push('High win rate');
    if (performanceAnalysis.drawdownCategory === 'low') strengths.push('Low drawdown');
    if (codeAnalysis.riskControls.length > 1) strengths.push('Multiple risk controls');
    return strengths.length > 0 ? strengths : ['Strategy executes without errors'];
  }

  private static identifyWeaknesses(codeAnalysis: CodeAnalysis, performanceAnalysis: PerformanceAnalysis): string[] {
    const weaknesses = [];
    if (performanceAnalysis.winRateCategory === 'low') weaknesses.push('Low win rate');
    if (performanceAnalysis.drawdownCategory === 'high') weaknesses.push('High drawdown');
    if (!codeAnalysis.hasStopLoss) weaknesses.push('No stop loss protection');
    return weaknesses;
  }

  private static assessRiskLevel(results: any, codeAnalysis: CodeAnalysis): 'low' | 'medium' | 'high' {
    if (results.maxDrawdown > 20 || !codeAnalysis.hasStopLoss) return 'high';
    if (results.maxDrawdown > 10) return 'medium';
    return 'low';
  }

  private static identifyMarketSuitability(codeAnalysis: CodeAnalysis): string[] {
    const suitability = [];
    if (codeAnalysis.strategyType.includes('Crossover')) suitability.push('Trending Markets');
    if (codeAnalysis.strategyType.includes('RSI')) suitability.push('Ranging Markets');
    return suitability.length > 0 ? suitability : ['General Market Conditions'];
  }
}
