
import React, { useState, useEffect } from 'react';
import StrategyConfiguration from './strategy/StrategyConfiguration';
import RiskManagement from './strategy/RiskManagement';
import ExecutionSettings from './strategy/ExecutionSettings';
import BacktestProgress from './strategy/BacktestProgress';
import StrategyHistory from './strategy/StrategyHistory';
import { useBacktest } from '@/hooks/useBacktest';
import { PythonExecutor } from '@/services/pythonExecutor';
import { StrategyStorage, StrategyResult } from '@/services/strategyStorage';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StrategyBuilderProps {
  onStrategyUpdate: (strategy: any) => void;
  onBacktestComplete: (results: any) => void;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ onStrategyUpdate, onBacktestComplete }) => {
  const [strategy, setStrategy] = useState({
    name: 'EMA Crossover Strategy',
    symbol: 'EURUSD=X',
    timeframe: '5m',
    initialBalance: 10000,
    riskPerTrade: 1,
    stopLoss: 50,
    takeProfit: 100,
    spread: 2,
    commission: 0.5,
    slippage: 1,
    code: `# EMA Crossover Strategy
# This strategy uses exponential moving averages for entry and exit signals

def strategy_logic(data):
    # Calculate EMAs using the TechnicalAnalysis helper
    short_ema = TechnicalAnalysis.ema(data['Close'].tolist(), 12)
    long_ema = TechnicalAnalysis.ema(data['Close'].tolist(), 26)
    
    # Entry signal: short EMA crosses above long EMA
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i == 0:
            entry.append(False)
            exit.append(False)
        else:
            # Entry: short EMA crosses above long EMA
            entry_signal = short_ema[i] > long_ema[i] and short_ema[i-1] <= long_ema[i-1]
            # Exit: short EMA crosses below long EMA
            exit_signal = short_ema[i] < long_ema[i] and short_ema[i-1] >= long_ema[i-1]
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'short_ema': short_ema,
        'long_ema': long_ema
    }

# Alternative: RSI Strategy
# def strategy_logic(data):
#     rsi = TechnicalAnalysis.rsi(data['Close'].tolist(), 14)
#     entry = [rsi[i] < 30 for i in range(len(rsi))]  # Oversold
#     exit = [rsi[i] > 70 for i in range(len(rsi))]   # Overbought
#     return {'entry': entry, 'exit': exit, 'rsi': rsi}`
  });

  const [pythonStatus, setPythonStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const { isRunning, currentStep, runBacktest } = useBacktest();
  const { toast } = useToast();

  useEffect(() => {
    // Check Python availability on component mount
    const checkPythonStatus = async () => {
      try {
        const isAvailable = await PythonExecutor.isAvailable();
        setPythonStatus(isAvailable ? 'available' : 'unavailable');
      } catch {
        setPythonStatus('unavailable');
      }
    };

    checkPythonStatus();
  }, []);

  const handleStrategyChange = (updates: any) => {
    setStrategy(prev => ({ ...prev, ...updates }));
  };

  const handleStrategySelect = (savedStrategy: StrategyResult) => {
    setStrategy(prev => ({
      ...prev,
      name: savedStrategy.strategy_name,
      code: savedStrategy.strategy_code,
      symbol: savedStrategy.symbol,
      timeframe: savedStrategy.timeframe
    }));
    
    toast({
      title: "Strategy Loaded",
      description: `Loaded "${savedStrategy.strategy_name}" strategy`,
    });
  };

  const handleBacktestComplete = async (results: any) => {
    // Save strategy results to database
    try {
      const strategyResult = {
        strategy_name: strategy.name,
        strategy_code: strategy.code,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        win_rate: results.winRate || 0,
        total_return: results.totalReturn || 0,
        total_trades: results.totalTrades || 0,
        profit_factor: results.profitFactor || 0,
        max_drawdown: results.maxDrawdown || 0,
      };

      await StrategyStorage.saveStrategyResult(strategyResult);
      
      toast({
        title: "Strategy Saved",
        description: "Backtest results have been saved to your history",
      });
    } catch (error) {
      console.error('Failed to save strategy results:', error);
      toast({
        title: "Save Failed",
        description: "Could not save strategy results",
        variant: "destructive",
      });
    }

    // Call the original callback
    onBacktestComplete(results);
  };

  const handleRunBacktest = () => {
    runBacktest(strategy, handleBacktestComplete);
  };

  return (
    <div className="space-y-6">
      {/* Python Execution Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Code className="h-5 w-5 text-slate-400" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">Python Execution Engine</span>
                {pythonStatus === 'checking' && (
                  <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                )}
                {pythonStatus === 'available' && (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                )}
                {pythonStatus === 'unavailable' && (
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                )}
              </div>
              <p className="text-sm text-slate-400">
                {pythonStatus === 'checking' && 'Initializing Python runtime...'}
                {pythonStatus === 'available' && 'Ready - Full Python strategy execution available'}
                {pythonStatus === 'unavailable' && 'Limited - Using pattern matching fallback'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <StrategyConfiguration 
            strategy={strategy} 
            onStrategyChange={handleStrategyChange} 
          />
        </div>

        {/* Risk Management & Execution */}
        <div className="space-y-6">
          <RiskManagement 
            strategy={strategy} 
            onStrategyChange={handleStrategyChange} 
          />
          
          <ExecutionSettings 
            strategy={strategy} 
            onStrategyChange={handleStrategyChange}
            onRunBacktest={handleRunBacktest}
            isRunning={isRunning}
          />
          
          <BacktestProgress currentStep={currentStep} />
          
          <StrategyHistory onStrategySelect={handleStrategySelect} />
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilder;
