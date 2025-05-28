
import { BacktestResults } from '@/types/backtest';

export interface TradePattern {
  type: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  frequency: number;
  avgReturn: number;
}

export interface StrategyRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'risk_management' | 'entry_timing' | 'exit_strategy' | 'position_sizing';
  priority: 'high' | 'medium' | 'low';
  estimatedImprovement: number;
  codeSnippet?: string;
  explanation: string;
}

export interface StrategyAnalysis {
  patterns: TradePattern[];
  recommendations: StrategyRecommendation[];
  lossAnalysis: {
    majorLossCause: string;
    lossClusters: string[];
    avgLossSize: number;
  };
  performanceMetrics: {
    overtrading: boolean;
    drawdownRisk: 'low' | 'medium' | 'high';
    consistency: number;
  };
}

export class StrategyCoach {
  static analyzeBacktest(results: any): StrategyAnalysis {
    const trades = results.trades || [];
    
    if (trades.length === 0) {
      return this.getEmptyAnalysis();
    }

    const patterns = this.identifyTradePatterns(trades);
    const recommendations = this.generateRecommendations(trades, results);
    const lossAnalysis = this.analyzeLosses(trades);
    const performanceMetrics = this.calculatePerformanceMetrics(trades, results);

    return {
      patterns,
      recommendations,
      lossAnalysis,
      performanceMetrics
    };
  }

  private static identifyTradePatterns(trades: any[]): TradePattern[] {
    const patterns: TradePattern[] = [];
    
    // Analyze win/loss streaks
    const streaks = this.calculateStreaks(trades);
    if (streaks.longestLossStreak > 5) {
      patterns.push({
        type: 'loss_streak',
        description: `Long losing streaks detected (up to ${streaks.longestLossStreak} consecutive losses)`,
        impact: 'negative',
        frequency: streaks.lossStreakCount,
        avgReturn: streaks.avgLossStreakReturn
      });
    }

    // Analyze trade frequency
    const avgTradesPerDay = this.calculateTradeFrequency(trades);
    if (avgTradesPerDay > 10) {
      patterns.push({
        type: 'overtrading',
        description: `High trade frequency (${avgTradesPerDay.toFixed(1)} trades/day on average)`,
        impact: 'negative',
        frequency: trades.length,
        avgReturn: trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length
      });
    }

    // Analyze trade duration vs profitability
    const shortTrades = trades.filter(t => t.duration < 60);
    const longTrades = trades.filter(t => t.duration >= 240);
    
    if (shortTrades.length > 0 && longTrades.length > 0) {
      const shortAvg = shortTrades.reduce((sum, t) => sum + t.pnl, 0) / shortTrades.length;
      const longAvg = longTrades.reduce((sum, t) => sum + t.pnl, 0) / longTrades.length;
      
      if (longAvg > shortAvg * 1.5) {
        patterns.push({
          type: 'hold_longer',
          description: 'Longer trades show significantly better returns',
          impact: 'positive',
          frequency: longTrades.length,
          avgReturn: longAvg
        });
      }
    }

    return patterns;
  }

  private static generateRecommendations(trades: any[], results: any): StrategyRecommendation[] {
    const recommendations: StrategyRecommendation[] = [];
    
    // Risk Management Recommendations
    const maxDrawdown = results.maxDrawdown || 0;
    if (maxDrawdown > 15) {
      recommendations.push({
        id: 'reduce_position_size',
        title: 'Reduce Position Size',
        description: 'High drawdown detected. Consider reducing position size to limit risk.',
        category: 'risk_management',
        priority: 'high',
        estimatedImprovement: 8,
        codeSnippet: `# Reduce position size calculation
position_size = balance * 0.01  # Use 1% risk instead of 2%
stop_loss_distance = entry_price * 0.002  # 20 pips for EUR/USD`,
        explanation: 'Lower position sizes reduce individual trade impact on your account'
      });
    }

    // Win Rate Improvements
    const winRate = results.winRate || 0;
    if (winRate < 45) {
      recommendations.push({
        id: 'add_trend_filter',
        title: 'Add Trend Filter',
        description: 'Low win rate suggests trading against the trend. Add trend confirmation.',
        category: 'entry_timing',
        priority: 'high',
        estimatedImprovement: 12,
        codeSnippet: `# Add trend filter using 200 EMA
ema_200 = TechnicalAnalysis.ema(data['Close'].tolist(), 200)
trend_up = data['Close'][i] > ema_200[i]

# Only enter long trades in uptrend
entry_signal = original_entry_signal and trend_up`,
        explanation: 'Trading with the trend increases probability of success'
      });
    }

    // Profit Factor Improvements
    const profitFactor = results.profitFactor || 0;
    if (profitFactor < 1.5) {
      recommendations.push({
        id: 'optimize_exit_strategy',
        title: 'Optimize Exit Strategy',
        description: 'Low profit factor suggests poor exit timing. Consider trailing stops.',
        category: 'exit_strategy',
        priority: 'medium',
        estimatedImprovement: 15,
        codeSnippet: `# Implement trailing stop
if position and current_price > position.entry * 1.002:  # 20 pips profit
    trailing_stop = current_price * 0.998  # Trail by 20 pips
    if current_price < trailing_stop:
        exit_signal = True`,
        explanation: 'Trailing stops help capture more profit during favorable moves'
      });
    }

    // Trade Frequency Optimization
    const avgTradesPerDay = this.calculateTradeFrequency(trades);
    if (avgTradesPerDay > 8) {
      recommendations.push({
        id: 'reduce_overtrading',
        title: 'Reduce Overtrading',
        description: 'High trade frequency may indicate noise trading. Add stronger filters.',
        category: 'entry_timing',
        priority: 'medium',
        estimatedImprovement: 10,
        codeSnippet: `# Add volatility filter
atr = TechnicalAnalysis.atr(data['High'], data['Low'], data['Close'], 14)
volatility_threshold = atr[i] > atr[i-20:i].mean() * 1.2

# Only trade during higher volatility
entry_signal = original_entry_signal and volatility_threshold`,
        explanation: 'Trading only during higher volatility periods improves signal quality'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private static analyzeLosses(trades: any[]): any {
    const losingTrades = trades.filter(t => t.pnl < 0);
    const avgLossSize = losingTrades.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losingTrades.length;
    
    // Find major loss causes
    const largeLosses = losingTrades.filter(t => Math.abs(t.pnl) > avgLossSize * 2);
    const majorLossCause = largeLosses.length > losingTrades.length * 0.3 
      ? 'Large individual losses are major contributors'
      : 'Consistent small losses accumulating';

    return {
      majorLossCause,
      lossClusters: this.findLossClusters(trades),
      avgLossSize
    };
  }

  private static calculatePerformanceMetrics(trades: any[], results: any): any {
    const avgTradesPerDay = this.calculateTradeFrequency(trades);
    const overtrading = avgTradesPerDay > 6;
    
    const drawdownRisk = results.maxDrawdown > 20 ? 'high' : 
                        results.maxDrawdown > 10 ? 'medium' : 'low';
    
    // Calculate consistency (lower standard deviation of returns = higher consistency)
    const returns = trades.map(t => t.pnl);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance) / Math.abs(avgReturn) * 10);

    return {
      overtrading,
      drawdownRisk,
      consistency: Math.round(consistency)
    };
  }

  private static calculateStreaks(trades: any[]): any {
    let currentStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let lossStreakCount = 0;
    let totalLossStreakReturn = 0;

    for (const trade of trades) {
      if (trade.pnl > 0) {
        if (currentStreak < 0) {
          // End of loss streak
          longestLossStreak = Math.max(longestLossStreak, Math.abs(currentStreak));
          if (Math.abs(currentStreak) > 3) {
            lossStreakCount++;
            totalLossStreakReturn += currentStreak;
          }
        }
        currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
        longestWinStreak = Math.max(longestWinStreak, currentStreak);
      } else {
        currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
      }
    }

    return {
      longestWinStreak,
      longestLossStreak,
      lossStreakCount,
      avgLossStreakReturn: lossStreakCount > 0 ? totalLossStreakReturn / lossStreakCount : 0
    };
  }

  private static calculateTradeFrequency(trades: any[]): number {
    if (trades.length < 2) return 0;
    
    const firstTrade = new Date(trades[0].date);
    const lastTrade = new Date(trades[trades.length - 1].date);
    const daysDiff = (lastTrade.getTime() - firstTrade.getTime()) / (1000 * 60 * 60 * 24);
    
    return trades.length / Math.max(daysDiff, 1);
  }

  private static findLossClusters(trades: any[]): string[] {
    const clusters: string[] = [];
    
    // Simple clustering based on consecutive losses
    let consecutiveLosses = 0;
    for (const trade of trades) {
      if (trade.pnl < 0) {
        consecutiveLosses++;
      } else {
        if (consecutiveLosses >= 4) {
          clusters.push(`${consecutiveLosses} consecutive losses detected`);
        }
        consecutiveLosses = 0;
      }
    }

    return clusters;
  }

  private static getEmptyAnalysis(): StrategyAnalysis {
    return {
      patterns: [],
      recommendations: [{
        id: 'no_trades',
        title: 'No Trades Executed',
        description: 'Strategy did not generate any trades. Consider adjusting entry conditions.',
        category: 'entry_timing',
        priority: 'high',
        estimatedImprovement: 0,
        explanation: 'A strategy that generates no trades needs more permissive entry conditions'
      }],
      lossAnalysis: {
        majorLossCause: 'No trades to analyze',
        lossClusters: [],
        avgLossSize: 0
      },
      performanceMetrics: {
        overtrading: false,
        drawdownRisk: 'low',
        consistency: 0
      }
    };
  }
}
