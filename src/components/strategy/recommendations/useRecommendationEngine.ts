
import { useMemo } from 'react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium';
  impact: string;
  implementation: string;
  action?: () => void;
  codeSnippet?: string;
}

interface UseRecommendationEngineProps {
  strategy: any;
  backtestResults?: any;
  onStrategyChange: (updates: any) => void;
}

export const useRecommendationEngine = ({ strategy, backtestResults, onStrategyChange }: UseRecommendationEngineProps) => {
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    
    // Analyze backtest results if available
    if (backtestResults) {
      const { winRate = 0, totalReturn = 0, maxDrawdown = 0, profitFactor = 0 } = backtestResults;
      
      if (totalReturn < 0) {
        recs.push({
          id: 'reverse_signals',
          title: 'Try Reverse Signals',
          description: 'Your strategy is losing money. Consider reversing the entry/exit signals.',
          priority: 'high',
          impact: 'High',
          implementation: 'Automatic',
          action: () => onStrategyChange({ reverseSignals: !strategy.reverseSignals })
        });
      }
      
      if (winRate < 40) {
        recs.push({
          id: 'trend_filter',
          title: 'Add Trend Filter',
          description: 'Low win rate suggests trading against the trend. Add EMA trend confirmation.',
          priority: 'high',
          impact: 'Medium-High',
          implementation: 'Code Enhancement',
          codeSnippet: `# Add trend filter after your existing calculations
ema_200 = TechnicalAnalysis.ema(data['Close'].tolist(), 200)
trend_up = [close[i] > ema_200[i] for i in range(len(close))]

# Modify your entry conditions to include trend filter
# For long entries: add "and trend_up[i]"
# For short entries: add "and not trend_up[i]"`
        });
      }
      
      if (maxDrawdown > 15) {
        recs.push({
          id: 'position_sizing',
          title: 'Reduce Position Size',
          description: 'High drawdown indicates excessive risk. Consider reducing position size.',
          priority: 'high',
          impact: 'High',
          implementation: 'Settings Adjustment',
          action: () => onStrategyChange({ riskPerTrade: Math.max(0.5, strategy.riskPerTrade * 0.5) })
        });
      }
      
      if (profitFactor < 1.5 && profitFactor > 0) {
        recs.push({
          id: 'stop_loss_optimization',
          title: 'Optimize Stop Loss',
          description: 'Profit factor suggests stops are too tight or too wide.',
          priority: 'medium',
          impact: 'Medium',
          implementation: 'Settings Adjustment',
          action: () => onStrategyChange({ 
            stopLoss: strategy.stopLoss > 50 ? strategy.stopLoss * 0.8 : strategy.stopLoss * 1.2 
          })
        });
      }
    }
    
    // General code-based recommendations
    const codeAnalysis = analyzeStrategyCode(strategy.code || '');
    
    if (!codeAnalysis.hasMultipleTimeframes) {
      recs.push({
        id: 'multiple_timeframes',
        title: 'Add Multiple Timeframe Analysis',
        description: 'Confirm signals on higher timeframes for better accuracy.',
        priority: 'medium',
        impact: 'Medium',
        implementation: 'Code Enhancement',
        codeSnippet: `# Add higher timeframe confirmation
# Calculate daily trend using 4-hour or daily data
daily_ema = TechnicalAnalysis.ema(data['Close'].tolist(), 21)
weekly_trend = [close[i] > daily_ema[i] for i in range(len(close))]

# Use weekly_trend[i] in your entry conditions`
      });
    }
    
    if (!codeAnalysis.hasVolatilityFilter) {
      recs.push({
        id: 'volatility_filter',
        title: 'Add Volatility Filter',
        description: 'Avoid trading during low volatility periods for better performance.',
        priority: 'medium',
        impact: 'Medium',
        implementation: 'Code Enhancement',
        codeSnippet: `# Add volatility filter
atr = TechnicalAnalysis.atr(data['High'], data['Low'], data['Close'], 14)
avg_atr = TechnicalAnalysis.sma(atr, 20)
high_volatility = [atr[i] > avg_atr[i] * 1.2 for i in range(len(atr))]

# Add "and high_volatility[i]" to your entry conditions`
      });
    }
    
    return recs;
  }, [strategy, backtestResults, onStrategyChange]);

  return { recommendations };
};

const analyzeStrategyCode = (code: string) => {
  return {
    hasMultipleTimeframes: code.includes('daily') || code.includes('weekly') || code.includes('4h'),
    hasVolatilityFilter: code.includes('atr') || code.includes('volatility'),
    hasTrendFilter: code.includes('ema_200') || code.includes('trend'),
    hasRiskManagement: code.includes('stop_loss') || code.includes('position_size')
  };
};
