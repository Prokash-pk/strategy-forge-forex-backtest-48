
import { StrategyResult } from '../strategyStorage';

export interface StrategyAnalytics {
  totalTests: number;
  highReturnTests: number;
  averageWinRate: number;
  averageReturn: number;
  topStrategies: StrategyResult[];
  recentTests: StrategyResult[];
  performanceBreakdown: {
    highWinRateHighReturn: number;
    highWinRateLowReturn: number;
    lowWinRateHighReturn: number;
    lowWinRateLowReturn: number;
  };
}

export interface PersonalizedRecommendation {
  strategy: StrategyResult;
  score: number;
  matchFactors: string[];
}

export interface UserPreferences {
  symbol: string;
  timeframe: string;
  riskTolerance: 'low' | 'medium' | 'high';
  targetReturn: number;
}

export interface PerformanceAnalysis {
  winRateVsReturnMismatch: StrategyResult[];
  consistentPerformers: StrategyResult[];
  underPerformers: StrategyResult[];
}
