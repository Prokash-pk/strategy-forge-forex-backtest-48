import { BacktestResults } from '@/types/backtest';
import { supabase } from '@/integrations/supabase/client';

export interface AIStrategyRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'risk_management' | 'entry_timing' | 'exit_strategy' | 'position_sizing' | 'market_analysis';
  priority: 'high' | 'medium' | 'low';
  estimatedImprovement: number;
  codeSnippet?: string;
  explanation: string;
  confidence: number;
  reasoning: string;
}

export interface AIStrategyAnalysis {
  overallAssessment: string;
  strengthsIdentified: string[];
  weaknessesIdentified: string[];
  marketConditionAnalysis: string;
  recommendations: AIStrategyRecommendation[];
  riskLevel: 'low' | 'medium' | 'high';
  complexityScore: number;
  marketSuitability: string[];
}

export class AIStrategyCoach {
  static async analyzeStrategyWithAI(
    strategyCode: string, 
    backtestResults: any,
    marketData?: any
  ): Promise<AIStrategyAnalysis> {
    try {
      console.log('Starting OpenAI-powered strategy analysis...');
      
      // Call the Supabase Edge Function for AI analysis
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

    } catch (error) {
      console.error('AI strategy analysis failed:', error);
      
      // Fallback to enhanced rule-based analysis if AI fails
      console.log('Falling back to enhanced rule-based analysis...');
      return this.performEnhancedFallbackAnalysis(strategyCode, backtestResults);
    }
  }

  private static performEnhancedFallbackAnalysis(
    strategyCode: string, 
    results: any
  ): AIStrategyAnalysis {
    console.log('Performing enhanced fallback analysis...');
    
    const codeAnalysis = this.analyzeStrategyCode(strategyCode);
    const performanceAnalysis = this.analyzePerformancePatterns(results);
    
    const recommendations = this.generateEnhancedRecommendations(
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

  private static analyzeStrategyCode(code: string) {
    const indicators = this.extractIndicators(code);
    const complexity = this.calculateComplexity(code);
    const strategyType = this.identifyStrategyType(code);
    const riskControls = this.identifyRiskControls(code);
    
    return {
      indicators,
      complexity,
      strategyType,
      riskControls,
      hasStopLoss: code.includes('stop_loss') || code.includes('sl'),
      hasTakeProfit: code.includes('take_profit') || code.includes('tp'),
      hasPositionSizing: code.includes('position_size') || code.includes('risk'),
      timeframeSensitive: code.includes('timeframe') || code.includes('period')
    };
  }

  private static extractIndicators(code: string): string[] {
    const indicators = [];
    const indicatorPatterns = [
      { pattern: /ema/i, name: 'EMA' },
      { pattern: /sma/i, name: 'SMA' },
      { pattern: /rsi/i, name: 'RSI' },
      { pattern: /macd/i, name: 'MACD' },
      { pattern: /bollinger/i, name: 'Bollinger Bands' },
      { pattern: /atr/i, name: 'ATR' },
      { pattern: /stochastic/i, name: 'Stochastic' }
    ];

    indicatorPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(code)) {
        indicators.push(name);
      }
    });

    return indicators;
  }

  private static calculateComplexity(code: string): number {
    let complexity = 0;
    complexity += (code.match(/if/g) || []).length * 2;
    complexity += (code.match(/for/g) || []).length * 3;
    complexity += (code.match(/and|or/g) || []).length;
    complexity += this.extractIndicators(code).length * 2;
    return Math.min(complexity, 100);
  }

  private static identifyStrategyType(code: string): string {
    if (code.includes('crossover') || (code.includes('ema') && code.includes('>'))) {
      return 'Moving Average Crossover';
    } else if (code.includes('rsi') && (code.includes('30') || code.includes('70'))) {
      return 'RSI Mean Reversion';
    } else if (code.includes('bollinger')) {
      return 'Bollinger Band Strategy';
    } else if (code.includes('macd')) {
      return 'MACD Strategy';
    }
    return 'Custom Strategy';
  }

  private static identifyRiskControls(code: string): string[] {
    const controls = [];
    if (code.includes('stop_loss') || code.includes('sl')) controls.push('Stop Loss');
    if (code.includes('take_profit') || code.includes('tp')) controls.push('Take Profit');
    if (code.includes('position_size')) controls.push('Position Sizing');
    return controls;
  }

  private static analyzePerformancePatterns(results: any) {
    const winRate = results.winRate || 0;
    const profitFactor = results.profitFactor || 0;
    const maxDrawdown = results.maxDrawdown || 0;

    return {
      winRateCategory: winRate > 60 ? 'high' : winRate > 45 ? 'medium' : 'low',
      profitFactorCategory: profitFactor > 2 ? 'excellent' : profitFactor > 1.5 ? 'good' : 'marginal',
      drawdownCategory: maxDrawdown < 10 ? 'low' : maxDrawdown < 20 ? 'medium' : 'high'
    };
  }

  private static generateEnhancedRecommendations(
    codeAnalysis: any,
    performanceAnalysis: any
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

  private static generateOverallAssessment(codeAnalysis: any, performanceAnalysis: any): string {
    if (performanceAnalysis.winRateCategory === 'high' && performanceAnalysis.profitFactorCategory === 'excellent') {
      return `Your ${codeAnalysis.strategyType} shows excellent performance with strong metrics.`;
    }
    return `Your ${codeAnalysis.strategyType} has room for improvement in risk management and signal quality.`;
  }

  private static identifyStrengths(codeAnalysis: any, performanceAnalysis: any): string[] {
    const strengths = [];
    if (performanceAnalysis.winRateCategory === 'high') strengths.push('High win rate');
    if (performanceAnalysis.drawdownCategory === 'low') strengths.push('Low drawdown');
    if (codeAnalysis.riskControls.length > 1) strengths.push('Multiple risk controls');
    return strengths.length > 0 ? strengths : ['Strategy executes without errors'];
  }

  private static identifyWeaknesses(codeAnalysis: any, performanceAnalysis: any): string[] {
    const weaknesses = [];
    if (performanceAnalysis.winRateCategory === 'low') weaknesses.push('Low win rate');
    if (performanceAnalysis.drawdownCategory === 'high') weaknesses.push('High drawdown');
    if (!codeAnalysis.hasStopLoss) weaknesses.push('No stop loss protection');
    return weaknesses;
  }

  private static assessRiskLevel(results: any, codeAnalysis: any): 'low' | 'medium' | 'high' {
    if (results.maxDrawdown > 20 || !codeAnalysis.hasStopLoss) return 'high';
    if (results.maxDrawdown > 10) return 'medium';
    return 'low';
  }

  private static identifyMarketSuitability(codeAnalysis: any): string[] {
    const suitability = [];
    if (codeAnalysis.strategyType.includes('Crossover')) suitability.push('Trending Markets');
    if (codeAnalysis.strategyType.includes('RSI')) suitability.push('Ranging Markets');
    return suitability.length > 0 ? suitability : ['General Market Conditions'];
  }
}
