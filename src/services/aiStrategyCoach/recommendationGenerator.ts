
import type { AIStrategyRecommendation, CodeAnalysis, PerformanceAnalysis } from './types';

export class RecommendationGenerator {
  static generateEnhancedRecommendations(
    codeAnalysis: CodeAnalysis,
    performanceAnalysis: PerformanceAnalysis
  ): AIStrategyRecommendation[] {
    const recommendations: AIStrategyRecommendation[] = [];

    if (performanceAnalysis.drawdownCategory === 'high') {
      recommendations.push({
        id: 'enhanced_risk_management',
        title: 'Implement Dynamic Risk Management',
        description: 'High drawdown detected. Add volatility-based position sizing.',
        category: 'risk_management',
        priority: 'high',
        estimatedImprovement: 25,
        confidence: 85,
        reasoning: 'High drawdown indicates excessive risk per trade',
        codeSnippet: `# Volatility-based position sizing
atr = TechnicalAnalysis.atr(data['High'], data['Low'], data['Close'], 14)
volatility_factor = atr[i] / TechnicalAnalysis.sma(atr, 20)[i] if not math.isnan(atr[i]) else 1
position_size = base_position_size / max(volatility_factor, 0.5)`,
        explanation: 'Reduces position size during high volatility periods'
      });
    }

    if (performanceAnalysis.winRateCategory === 'low') {
      recommendations.push({
        id: 'trend_filter',
        title: 'Add Trend Strength Filter',
        description: 'Low win rate suggests poor timing. Add trend confirmation.',
        category: 'entry_timing',
        priority: 'high',
        estimatedImprovement: 20,
        confidence: 80,
        reasoning: 'Low win rate often indicates trading against trend',
        codeSnippet: `# Trend strength filter
ema_21 = TechnicalAnalysis.ema(data['Close'].tolist(), 21)
ema_55 = TechnicalAnalysis.ema(data['Close'].tolist(), 55)
trend_strength = abs(ema_21[i] - ema_55[i]) / ema_55[i] if not math.isnan(ema_55[i]) else 0
strong_trend = trend_strength > 0.002`,
        explanation: 'Only trades during strong trending conditions'
      });
    }

    return recommendations;
  }
}
