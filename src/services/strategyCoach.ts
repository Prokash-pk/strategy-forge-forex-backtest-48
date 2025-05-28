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
        description: 'High drawdown detected. Implementing dynamic position sizing based on account balance.',
        category: 'risk_management',
        priority: 'high',
        estimatedImprovement: 8,
        codeSnippet: `# Dynamic position sizing based on risk
risk_per_trade = 0.01  # 1% risk per trade instead of 2%
account_balance = 10000  # Update dynamically
max_loss_per_trade = account_balance * risk_per_trade
position_size = max_loss_per_trade / (stop_loss_distance * pip_value)`,
        explanation: 'This reduces position size from 2% to 1% risk per trade, significantly lowering drawdown risk'
      });
    }

    // Win Rate Improvements with actual logic replacement
    const winRate = results.winRate || 0;
    if (winRate < 45) {
      recommendations.push({
        id: 'add_trend_filter',
        title: 'Add Trend Filter',
        description: 'Low win rate suggests trading against trend. Adding 200 EMA trend filter.',
        category: 'entry_timing',
        priority: 'high',
        estimatedImprovement: 12,
        codeSnippet: `# Add trend filter using 200 EMA
ema_200 = TechnicalAnalysis.ema(data['Close'].tolist(), 200)
trend_up = data['Close'][i] > ema_200[i] if not math.isnan(ema_200[i]) else False`,
        explanation: 'Only takes trades in the direction of the longer-term trend, improving win rate'
      });
    }

    // Profit Factor Improvements with enhanced exit logic
    const profitFactor = results.profitFactor || 0;
    if (profitFactor < 1.5) {
      recommendations.push({
        id: 'optimize_exit_strategy',
        title: 'Implement Trailing Stop',
        description: 'Low profit factor. Adding trailing stop to capture more profit during favorable moves.',
        category: 'exit_strategy',
        priority: 'medium',
        estimatedImprovement: 15,
        codeSnippet: `# Implement dynamic trailing stop
if i > 0 and entry[i-1]:  # Position opened in previous bar
    entry_price = data['Close'][i-1]
    current_profit_pips = (data['Close'][i] - entry_price) * 10000
    
    # Start trailing after 20 pips profit
    if current_profit_pips > 20:
        trailing_stop_distance = 15  # Trail by 15 pips
        trailing_stop = data['Close'][i] - (trailing_stop_distance / 10000)`,
        explanation: 'Trailing stops help capture more profit during strong moves while protecting gains'
      });
    }

    // Trade Frequency Optimization with volatility filter
    const avgTradesPerDay = this.calculateTradeFrequency(trades);
    if (avgTradesPerDay > 8) {
      recommendations.push({
        id: 'reduce_overtrading',
        title: 'Add Volatility Filter',
        description: 'High trade frequency detected. Adding ATR-based volatility filter.',
        category: 'entry_timing',
        priority: 'medium',
        estimatedImprovement: 10,
        codeSnippet: `# Add volatility filter using ATR
atr = TechnicalAnalysis.atr(data['High'], data['Low'], data['Close'], 14)
atr_ma = TechnicalAnalysis.sma(atr, 20)
volatility_threshold = atr[i] > atr_ma[i] * 1.2 if not math.isnan(atr[i]) else False`,
        explanation: 'Only trades during higher volatility periods, reducing noise and improving signal quality'
      });
    }

    // Add stop loss optimization if many large losses
    const largeLosses = trades.filter(t => t.pnl < -100);
    if (largeLosses.length > trades.length * 0.2) {
      recommendations.push({
        id: 'optimize_stop_loss',
        title: 'Dynamic Stop Loss',
        description: 'Large losses detected. Implementing ATR-based dynamic stop loss.',
        category: 'risk_management',
        priority: 'high',
        estimatedImprovement: 12,
        codeSnippet: `# Dynamic stop loss based on ATR
atr = TechnicalAnalysis.atr(data['High'], data['Low'], data['Close'], 14)
dynamic_sl_distance = atr[i] * 2  # 2x ATR stop loss
stop_loss_price = entry_price - dynamic_sl_distance if not math.isnan(atr[i]) else entry_price - 0.005`,
        explanation: 'ATR-based stops adapt to market volatility, preventing large losses in volatile conditions'
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
        codeSnippet: `# More permissive entry conditions
# Try reducing thresholds or adding alternative signals
entry_signal = short_ema[i] > long_ema[i]  # Remove crossover requirement
# OR add RSI oversold condition
rsi = TechnicalAnalysis.rsi(data['Close'].tolist(), 14)
rsi_oversold = rsi[i] < 35 if not math.isnan(rsi[i]) else False
entry_signal = entry_signal or rsi_oversold`,
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
