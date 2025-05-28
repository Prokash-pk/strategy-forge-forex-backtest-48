
import React, { useState } from 'react';
import StrategyConfiguration from './strategy/StrategyConfiguration';
import RiskManagement from './strategy/RiskManagement';
import ExecutionSettings from './strategy/ExecutionSettings';
import BacktestProgress from './strategy/BacktestProgress';
import { useBacktest } from '@/hooks/useBacktest';

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
    # Calculate EMAs
    short_ema = data['Close'].ewm(span=12).mean()
    long_ema = data['Close'].ewm(span=26).mean()
    
    # Entry signal: short EMA crosses above long EMA
    entry = (short_ema > long_ema) & (short_ema.shift(1) <= long_ema.shift(1))
    
    # Exit signal: short EMA crosses below long EMA
    exit = (short_ema < long_ema) & (short_ema.shift(1) >= long_ema.shift(1))
    
    return {
        'entry': entry,
        'exit': exit,
        'short_ema': short_ema,
        'long_ema': long_ema
    }

# Alternative: RSI Strategy
# def strategy_logic(data):
#     rsi = calculate_rsi(data['Close'], 14)
#     entry = rsi < 30  # Oversold
#     exit = rsi > 70   # Overbought
#     return {'entry': entry, 'exit': exit, 'rsi': rsi}`
  });

  const { isRunning, currentStep, runBacktest } = useBacktest();

  const handleStrategyChange = (updates: any) => {
    setStrategy(prev => ({ ...prev, ...updates }));
  };

  const handleRunBacktest = () => {
    runBacktest(strategy, onBacktestComplete);
  };

  return (
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
      </div>
    </div>
  );
};

export default StrategyBuilder;
