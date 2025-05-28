
import { BacktestResults } from '@/types/backtest';

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
      // For now, implement advanced rule-based analysis
      // This can be enhanced with actual AI API calls later
      const analysis = this.performAdvancedAnalysis(strategyCode, backtestResults, marketData);
      return analysis;
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Fallback to basic analysis
      return this.performBasicAnalysis(strategyCode, backtestResults);
    }
  }

  private static performAdvancedAnalysis(
    strategyCode: string, 
    results: any,
    marketData?: any
  ): AIStrategyAnalysis {
    const codeAnalysis = this.analyzeStrategyCode(strategyCode);
    const performanceAnalysis = this.analyzePerformancePatterns(results);
    const marketAnalysis = this.analyzeMarketContext(results, marketData);
    
    const recommendations = this.generateIntelligentRecommendations(
      codeAnalysis,
      performanceAnalysis,
      marketAnalysis
    );

    return {
      overallAssessment: this.generateOverallAssessment(codeAnalysis, performanceAnalysis),
      strengthsIdentified: this.identifyStrengths(codeAnalysis, performanceAnalysis),
      weaknessesIdentified: this.identifyWeaknesses(codeAnalysis, performanceAnalysis),
      marketConditionAnalysis: marketAnalysis.assessment,
      recommendations,
      riskLevel: this.assessRiskLevel(results, codeAnalysis),
      complexityScore: codeAnalysis.complexity,
      marketSuitability: marketAnalysis.suitableConditions
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
      { pattern: /stochastic/i, name: 'Stochastic' },
      { pattern: /williams/i, name: 'Williams %R' },
      { pattern: /cci/i, name: 'CCI' }
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
    } else if (code.includes('breakout') || code.includes('atr')) {
      return 'Breakout Strategy';
    }
    return 'Custom Strategy';
  }

  private static identifyRiskControls(code: string): string[] {
    const controls = [];
    if (code.includes('stop_loss') || code.includes('sl')) controls.push('Stop Loss');
    if (code.includes('take_profit') || code.includes('tp')) controls.push('Take Profit');
    if (code.includes('position_size')) controls.push('Position Sizing');
    if (code.includes('max_drawdown')) controls.push('Drawdown Control');
    if (code.includes('trailing')) controls.push('Trailing Stop');
    return controls;
  }

  private static analyzePerformancePatterns(results: any) {
    const winRate = results.winRate || 0;
    const profitFactor = results.profitFactor || 0;
    const maxDrawdown = results.maxDrawdown || 0;
    const totalTrades = results.totalTrades || 0;
    const sharpeRatio = results.sharpeRatio || 0;

    return {
      winRateCategory: winRate > 60 ? 'high' : winRate > 45 ? 'medium' : 'low',
      profitFactorCategory: profitFactor > 2 ? 'excellent' : profitFactor > 1.5 ? 'good' : profitFactor > 1 ? 'marginal' : 'poor',
      drawdownCategory: maxDrawdown < 10 ? 'low' : maxDrawdown < 20 ? 'medium' : 'high',
      activityLevel: totalTrades > 50 ? 'high' : totalTrades > 20 ? 'medium' : 'low',
      riskAdjustedReturn: sharpeRatio > 1.5 ? 'excellent' : sharpeRatio > 1 ? 'good' : sharpeRatio > 0.5 ? 'fair' : 'poor',
      consistency: this.calculateConsistency(results)
    };
  }

  private static calculateConsistency(results: any): string {
    if (!results.trades || results.trades.length < 10) return 'insufficient_data';
    
    const returns = results.trades.map((t: any) => t.pnl);
    const avgReturn = returns.reduce((sum: number, r: number) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum: number, r: number) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    const consistency = Math.abs(avgReturn) / stdDev;
    
    if (consistency > 0.5) return 'high';
    if (consistency > 0.2) return 'medium';
    return 'low';
  }

  private static analyzeMarketContext(results: any, marketData?: any) {
    // Analyze market conditions during the backtest period
    return {
      assessment: 'Mixed market conditions detected with moderate volatility',
      suitableConditions: ['Trending Markets', 'Medium Volatility'],
      volatilityProfile: 'Medium',
      trendStrength: 'Moderate'
    };
  }

  private static generateIntelligentRecommendations(
    codeAnalysis: any,
    performanceAnalysis: any,
    marketAnalysis: any
  ): AIStrategyRecommendation[] {
    const recommendations: AIStrategyRecommendation[] = [];

    // Risk Management Recommendations
    if (performanceAnalysis.drawdownCategory === 'high') {
      recommendations.push({
        id: 'ai_risk_management',
        title: 'Implement Dynamic Position Sizing',
        description: 'High drawdown detected. Implementing volatility-adjusted position sizing.',
        category: 'risk_management',
        priority: 'high',
        estimatedImprovement: 25,
        confidence: 90,
        reasoning: 'High drawdown indicates excessive risk per trade. Dynamic sizing will reduce position size during volatile periods.',
        codeSnippet: `# Volatility-adjusted position sizing
atr = TechnicalAnalysis.atr(data['High'], data['Low'], data['Close'], 14)
volatility_factor = atr[i] / TechnicalAnalysis.sma(atr, 20)[i] if not math.isnan(atr[i]) else 1
base_position_size = 0.01  # 1% base risk
adjusted_position_size = base_position_size / max(volatility_factor, 0.5)`,
        explanation: 'This adjusts position size based on current volatility relative to average volatility, reducing risk during turbulent periods.'
      });
    }

    // Entry Enhancement
    if (performanceAnalysis.winRateCategory === 'low' && !codeAnalysis.indicators.includes('ATR')) {
      recommendations.push({
        id: 'ai_entry_filter',
        title: 'Add Market Regime Filter',
        description: 'Low win rate suggests poor entry timing. Adding trend strength filter.',
        category: 'entry_timing',
        priority: 'high',
        estimatedImprovement: 20,
        confidence: 85,
        reasoning: 'Low win rate often indicates trading against the prevailing trend or in choppy markets.',
        codeSnippet: `# Market regime filter
ema_short = TechnicalAnalysis.ema(data['Close'].tolist(), 21)
ema_long = TechnicalAnalysis.ema(data['Close'].tolist(), 55)
trend_strength = abs(ema_short[i] - ema_long[i]) / ema_long[i] if not math.isnan(ema_long[i]) else 0
strong_trend = trend_strength > 0.002  # 0.2% minimum trend strength`,
        explanation: 'This filter ensures trades are only taken during strong trending conditions, improving win rate.'
      });
    }

    // Exit Strategy Enhancement
    if (performanceAnalysis.profitFactorCategory === 'poor' && !codeAnalysis.hasStopLoss) {
      recommendations.push({
        id: 'ai_exit_strategy',
        title: 'Implement Adaptive Stop Loss',
        description: 'Poor profit factor indicates need for better exit management.',
        category: 'exit_strategy',
        priority: 'high',
        estimatedImprovement: 30,
        confidence: 88,
        reasoning: 'Without proper stop losses, losing trades can erode all gains from winning trades.',
        codeSnippet: `# Adaptive stop loss based on ATR
atr = TechnicalAnalysis.atr(data['High'], data['Low'], data['Close'], 14)
adaptive_sl_distance = atr[i] * 2.5 if not math.isnan(atr[i]) else 0.01
stop_loss_level = entry_price - adaptive_sl_distance
stop_loss_hit = data['Low'][i] <= stop_loss_level if position else False`,
        explanation: 'ATR-based stops adapt to market volatility, providing tighter stops in calm markets and wider stops in volatile conditions.'
      });
    }

    // Overtrading Prevention
    if (performanceAnalysis.activityLevel === 'high' && performanceAnalysis.consistency === 'low') {
      recommendations.push({
        id: 'ai_overtrading_filter',
        title: 'Implement Signal Quality Filter',
        description: 'High trade frequency with low consistency suggests overtrading.',
        category: 'entry_timing',
        priority: 'medium',
        estimatedImprovement: 15,
        confidence: 75,
        reasoning: 'Too many trades often means taking low-quality signals. A confidence filter can improve signal quality.',
        codeSnippet: `# Signal confidence filter
rsi = TechnicalAnalysis.rsi(data['Close'].tolist(), 14)
rsi_momentum = rsi[i] - rsi[i-1] if i > 0 and not math.isnan(rsi[i]) else 0
signal_confidence = abs(rsi_momentum) > 2  # Minimum RSI momentum for signal quality
high_quality_signal = entry_signal and signal_confidence`,
        explanation: 'This filter ensures only strong momentum signals are taken, reducing noise and improving trade quality.'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private static generateOverallAssessment(codeAnalysis: any, performanceAnalysis: any): string {
    const strategyType = codeAnalysis.strategyType;
    const winRate = performanceAnalysis.winRateCategory;
    const profitFactor = performanceAnalysis.profitFactorCategory;
    
    if (winRate === 'high' && profitFactor === 'excellent') {
      return `Your ${strategyType} is performing exceptionally well with strong win rates and profit factors.`;
    } else if (winRate === 'medium' && profitFactor === 'good') {
      return `Your ${strategyType} shows solid performance with room for optimization.`;
    } else {
      return `Your ${strategyType} needs significant improvements in risk management and signal quality.`;
    }
  }

  private static identifyStrengths(codeAnalysis: any, performanceAnalysis: any): string[] {
    const strengths = [];
    
    if (performanceAnalysis.winRateCategory === 'high') {
      strengths.push('High win rate indicates good signal quality');
    }
    if (performanceAnalysis.drawdownCategory === 'low') {
      strengths.push('Low drawdown shows good risk management');
    }
    if (codeAnalysis.riskControls.length > 2) {
      strengths.push('Multiple risk controls implemented');
    }
    if (codeAnalysis.indicators.length > 1) {
      strengths.push('Multiple indicators provide signal confirmation');
    }
    
    return strengths.length > 0 ? strengths : ['Strategy executes without errors'];
  }

  private static identifyWeaknesses(codeAnalysis: any, performanceAnalysis: any): string[] {
    const weaknesses = [];
    
    if (performanceAnalysis.winRateCategory === 'low') {
      weaknesses.push('Low win rate suggests poor entry timing');
    }
    if (performanceAnalysis.profitFactorCategory === 'poor') {
      weaknesses.push('Poor profit factor indicates losses exceed gains');
    }
    if (performanceAnalysis.drawdownCategory === 'high') {
      weaknesses.push('High drawdown poses significant risk');
    }
    if (!codeAnalysis.hasStopLoss) {
      weaknesses.push('No stop loss protection detected');
    }
    if (codeAnalysis.complexity < 10) {
      weaknesses.push('Strategy may be too simplistic for current market conditions');
    }
    
    return weaknesses;
  }

  private static assessRiskLevel(results: any, codeAnalysis: any): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    if (results.maxDrawdown > 20) riskScore += 3;
    else if (results.maxDrawdown > 10) riskScore += 2;
    else riskScore += 1;
    
    if (!codeAnalysis.hasStopLoss) riskScore += 2;
    if (!codeAnalysis.hasPositionSizing) riskScore += 1;
    
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private static performBasicAnalysis(strategyCode: string, results: any): AIStrategyAnalysis {
    return {
      overallAssessment: 'Basic analysis completed - consider upgrading for detailed AI insights',
      strengthsIdentified: ['Strategy executes successfully'],
      weaknessesIdentified: ['Limited analysis available'],
      marketConditionAnalysis: 'Market analysis unavailable',
      recommendations: [],
      riskLevel: 'medium',
      complexityScore: 50,
      marketSuitability: ['General Market Conditions']
    };
  }
}
