
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

export interface CodeAnalysis {
  indicators: string[];
  complexity: number;
  strategyType: string;
  riskControls: string[];
  hasStopLoss: boolean;
  hasTakeProfit: boolean;
  hasPositionSizing: boolean;
  timeframeSensitive: boolean;
}

export interface PerformanceAnalysis {
  winRateCategory: 'high' | 'medium' | 'low';
  profitFactorCategory: 'excellent' | 'good' | 'marginal';
  drawdownCategory: 'low' | 'medium' | 'high';
}
