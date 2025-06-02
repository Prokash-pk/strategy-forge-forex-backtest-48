
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
    
    // Always provide some basic recommendations if we have strategy code
    if (strategy && strategy.code) {
      // Analyze backtest results if available
      if (backtestResults) {
        const { winRate = 0, totalReturn = 0, maxDrawdown = 0, profitFactor = 0, totalTrades = 0 } = backtestResults;
        
        // If strategy is losing money, suggest reversing signals
        if (totalReturn < -5) {
          recs.push({
            id: 'reverse_signals',
            title: 'Try Reverse Signals',
            description: 'Your strategy is losing money. Consider reversing the entry/exit signals.',
            priority: 'high',
            impact: 'High - Could turn losses into profits',
            implementation: 'Automatic',
            action: () => onStrategyChange({ 
              reverseSignals: !strategy.reverseSignals,
              name: strategy.reverseSignals 
                ? strategy.name.replace(' (Reversed)', '') 
                : `${strategy.name} (Reversed)`
            })
          });
        }
        
        // Low win rate suggestions
        if (winRate < 45 && totalTrades > 5) {
          recs.push({
            id: 'add_trend_filter',
            title: 'Add Trend Filter',
            description: 'Low win rate suggests trading against the trend. Add EMA trend confirmation.',
            priority: 'high',
            impact: 'Medium-High - Improves win rate',
            implementation: 'Code Enhancement',
            codeSnippet: `# Add trend filter after your existing calculations
ema_200 = TechnicalAnalysis.ema(data['Close'].tolist(), 200)
trend_up = [close[i] > ema_200[i] if not math.isnan(ema_200[i]) else False for i in range(len(close))]

# Modify your entry conditions to include trend filter
# For long entries: add "and trend_up[i]"
# For short entries: add "and not trend_up[i]"`
          });
        }
        
        // High drawdown protection
        if (maxDrawdown > 15) {
          recs.push({
            id: 'reduce_position_size',
            title: 'Reduce Position Size',
            description: 'High drawdown detected. Reducing risk per trade for better capital preservation.',
            priority: 'high',
            impact: 'High - Reduces risk significantly',
            implementation: 'Settings Adjustment',
            action: () => onStrategyChange({ 
              riskPerTrade: Math.max(0.5, (strategy.riskPerTrade || 2) * 0.5) 
            })
          });
        }
        
        // Poor profit factor
        if (profitFactor < 1.5 && profitFactor > 0) {
          recs.push({
            id: 'optimize_exits',
            title: 'Optimize Exit Strategy',
            description: 'Low profit factor indicates exits need improvement. Add trailing stops.',
            priority: 'medium',
            impact: 'Medium - Better profit capture',
            implementation: 'Code Enhancement',
            codeSnippet: `# Add trailing stop logic
if current_position and profit_pips > 20:
    trailing_stop = current_price - (15 / 10000)  # 15 pip trailing stop
    exit_signal = close[i] <= trailing_stop`
          });
        }
      } else {
        // No backtest results - provide general optimization recommendations
        recs.push({
          id: 'run_backtest_first',
          title: 'Run Backtest Analysis',
          description: 'Run a backtest first to get personalized optimization recommendations.',
          priority: 'high',
          impact: 'Essential for optimization',
          implementation: 'Required Step',
          action: () => {
            // This would trigger a backtest run
            console.log('Trigger backtest run');
          }
        });
      }
      
      // Code-based recommendations
      const codeAnalysis = analyzeStrategyCode(strategy.code || '');
      
      if (!codeAnalysis.hasMultipleTimeframes) {
        recs.push({
          id: 'multiple_timeframes',
          title: 'Add Higher Timeframe Confirmation',
          description: 'Confirm signals on higher timeframes for better accuracy.',
          priority: 'medium',
          impact: 'Medium - Improves signal quality',
          implementation: 'Code Enhancement',
          codeSnippet: `# Add higher timeframe trend confirmation
daily_ema = TechnicalAnalysis.ema(data['Close'].tolist(), 50)
higher_tf_trend = [close[i] > daily_ema[i] if not math.isnan(daily_ema[i]) else True for i in range(len(close))]

# Add to your entry conditions: and higher_tf_trend[i]`
        });
      }
      
      if (!codeAnalysis.hasVolatilityFilter) {
        recs.push({
          id: 'volatility_filter',
          title: 'Add Volatility Filter',
          description: 'Only trade during high volatility periods for better performance.',
          priority: 'medium',
          impact: 'Medium - Reduces false signals',
          implementation: 'Code Enhancement',
          codeSnippet: `# Add volatility filter using ATR
atr = TechnicalAnalysis.atr(data['High'], data['Low'], data['Close'], 14)
avg_atr = TechnicalAnalysis.sma(atr, 20)
high_volatility = [atr[i] > avg_atr[i] * 1.2 if not math.isnan(atr[i]) and not math.isnan(avg_atr[i]) else False for i in range(len(atr))]

# Add to entry conditions: and high_volatility[i]`
        });
      }
    }
    
    return recs.slice(0, 5); // Limit to top 5 recommendations
  }, [strategy, backtestResults, onStrategyChange]);

  return { recommendations };
};

const analyzeStrategyCode = (code: string) => {
  return {
    hasMultipleTimeframes: code.includes('daily') || code.includes('weekly') || code.includes('4h') || code.includes('TechnicalAnalysis.ema(') && code.includes('200'),
    hasVolatilityFilter: code.includes('atr') || code.includes('volatility') || code.includes('ATR'),
    hasTrendFilter: code.includes('ema_200') || code.includes('trend') || code.includes('daily_ema'),
    hasRiskManagement: code.includes('stop_loss') || code.includes('position_size') || code.includes('risk')
  };
};
