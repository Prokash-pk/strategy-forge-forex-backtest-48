
import type { CodeAnalysis } from './types';

export class CodeAnalyzer {
  static analyzeStrategyCode(code: string): CodeAnalysis {
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
}
