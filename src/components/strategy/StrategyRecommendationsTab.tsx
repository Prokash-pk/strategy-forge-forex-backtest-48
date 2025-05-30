
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, Target, CheckCircle, PlusCircle } from 'lucide-react';

interface StrategyRecommendationsTabProps {
  strategy: any;
  backtestResults?: any;
  onStrategyChange: (updates: any) => void;
}

const StrategyRecommendationsTab: React.FC<StrategyRecommendationsTabProps> = ({
  strategy,
  backtestResults,
  onStrategyChange
}) => {
  const getRecommendations = () => {
    const recommendations = [];
    
    // Analyze backtest results if available
    if (backtestResults) {
      const { winRate = 0, totalReturn = 0, maxDrawdown = 0, profitFactor = 0 } = backtestResults;
      
      if (totalReturn < 0) {
        recommendations.push({
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
        recommendations.push({
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
        recommendations.push({
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
        recommendations.push({
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
      recommendations.push({
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
      recommendations.push({
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
    
    return recommendations;
  };

  const analyzeStrategyCode = (code: string) => {
    return {
      hasMultipleTimeframes: code.includes('daily') || code.includes('weekly') || code.includes('4h'),
      hasVolatilityFilter: code.includes('atr') || code.includes('volatility'),
      hasTrendFilter: code.includes('ema_200') || code.includes('trend'),
      hasRiskManagement: code.includes('stop_loss') || code.includes('position_size')
    };
  };

  const handleAddCode = (codeSnippet: string) => {
    const enhancedCode = `${strategy.code}\n\n# Strategy Enhancement\n${codeSnippet}`;
    onStrategyChange({ code: enhancedCode });
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2 flex items-center justify-center gap-2">
          <Target className="h-5 w-5 text-blue-400" />
          Strategy Improvement Recommendations
        </h3>
        <p className="text-slate-400">AI-powered suggestions to improve your strategy performance</p>
      </div>

      {recommendations.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Great Strategy!</h3>
            <p className="text-slate-400">
              No immediate improvements detected. Run a backtest to get performance-based recommendations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <CardTitle className="text-white text-lg">{rec.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`${
                        rec.priority === 'high' 
                          ? 'bg-red-500/10 text-red-400' 
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}
                    >
                      {rec.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                    </Badge>
                    <Badge variant="outline" className="text-slate-300">
                      {rec.impact} Impact
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-slate-300">{rec.description}</p>
                
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Implementation:</h4>
                  <p className="text-sm text-slate-300">{rec.implementation}</p>
                </div>

                {rec.codeSnippet && (
                  <div className="bg-slate-900 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-2">Code Enhancement:</h4>
                    <pre className="text-xs text-slate-300 overflow-x-auto">
                      {rec.codeSnippet}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2">
                  {rec.action && (
                    <Button 
                      onClick={rec.action}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Apply Fix
                    </Button>
                  )}
                  {rec.codeSnippet && (
                    <Button 
                      onClick={() => handleAddCode(rec.codeSnippet)}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add to Strategy
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center text-sm text-slate-400 mt-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="text-amber-400 font-medium">Performance Tips</span>
        </div>
        <p>Always test recommendations on historical data before live trading.</p>
        <p>Consider market conditions and your risk tolerance when implementing changes.</p>
      </div>
    </div>
  );
};

export default StrategyRecommendationsTab;
