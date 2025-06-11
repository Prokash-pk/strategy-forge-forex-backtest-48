
import type { PerformanceAnalysis } from './types';

export class PerformanceAnalyzer {
  static analyzePerformancePatterns(results: any): PerformanceAnalysis {
    const winRate = results.winRate || 0;
    const profitFactor = results.profitFactor || 0;
    const maxDrawdown = results.maxDrawdown || 0;

    return {
      winRateCategory: winRate > 60 ? 'high' : winRate > 45 ? 'medium' : 'low',
      profitFactorCategory: profitFactor > 2 ? 'excellent' : profitFactor > 1.5 ? 'good' : 'marginal',
      drawdownCategory: maxDrawdown < 10 ? 'low' : maxDrawdown < 20 ? 'medium' : 'high'
    };
  }
}
