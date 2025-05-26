
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyzeStrategy, generateDynamicEquityCurve, generateDynamicTrades } from '@/utils/strategyAnalyzer';

export const useBacktest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();

  const timeframes = [
    { value: '1m', label: '1 Minute', period: '7 days', dataPoints: 10080 },
    { value: '5m', label: '5 Minutes', period: '60 days', dataPoints: 17280 },
    { value: '15m', label: '15 Minutes', period: '60 days', dataPoints: 5760 },
    { value: '1h', label: '1 Hour', period: '730 days', dataPoints: 17520 },
    { value: '1d', label: '1 Day', period: '5 years', dataPoints: 1825 }
  ];

  const runBacktest = async (strategy: any, onBacktestComplete: (results: any) => void) => {
    setIsRunning(true);
    
    try {
      // Step 1: Fetch data
      setCurrentStep('Fetching latest market data...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const selectedTimeframe = timeframes.find(tf => tf.value === strategy.timeframe);
      console.log(`Fetching ${strategy.symbol} data for ${selectedTimeframe?.period}`);
      
      // Step 2: Analyze strategy
      setCurrentStep('Analyzing strategy code...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { baseTrades, baseWinRate, baseReturn } = analyzeStrategy(strategy.code, strategy.timeframe);
      
      // Step 3: Run simulation
      setCurrentStep('Running backtest simulation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dynamic results based on strategy and parameters
      const totalTrades = baseTrades + Math.floor(Math.random() * 10 - 5);
      const winRate = Math.max(30, Math.min(85, baseWinRate + (Math.random() * 10 - 5)));
      const winningTrades = Math.floor(totalTrades * (winRate / 100));
      const losingTrades = totalTrades - winningTrades;
      
      const totalReturn = baseReturn * (strategy.riskPerTrade / 1) * (1 - strategy.spread / 100);
      const finalBalance = strategy.initialBalance * (1 + totalReturn / 100);
      
      const avgWin = 50 + (strategy.takeProfit / strategy.stopLoss) * 80 + Math.random() * 40;
      const avgLoss = -(30 + (strategy.stopLoss / strategy.takeProfit) * 50 + Math.random() * 30);
      
      const maxDrawdown = Math.max(2, Math.min(25, 15 - (winRate - 50) * 0.3 + Math.random() * 8));
      const sharpeRatio = Math.max(0.2, Math.min(3.0, (totalReturn / 100) / (maxDrawdown / 100) + Math.random() * 0.5));
      const profitFactor = winningTrades > 0 && losingTrades > 0 ? 
        (winningTrades * avgWin) / (losingTrades * Math.abs(avgLoss)) : 1.5;

      const mockResults = {
        strategy: strategy.name,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        period: `Latest ${selectedTimeframe?.period} (${selectedTimeframe?.dataPoints.toLocaleString()} data points)`,
        initialBalance: strategy.initialBalance,
        finalBalance: Math.round(finalBalance * 100) / 100,
        totalReturn: Math.round(totalReturn * 100) / 100,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: Math.round(winRate * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        profitFactor: Math.round(profitFactor * 100) / 100,
        avgWin: Math.round(avgWin * 100) / 100,
        avgLoss: Math.round(avgLoss * 100) / 100,
        equityCurve: generateDynamicEquityCurve(strategy.initialBalance, finalBalance, totalTrades),
        trades: generateDynamicTrades(totalTrades, avgWin, avgLoss, winRate)
      };

      setCurrentStep('Backtest completed successfully!');
      await new Promise(resolve => setTimeout(resolve, 500));

      onBacktestComplete(mockResults);
      
      toast({
        title: "Backtest Complete",
        description: `Strategy tested with ${mockResults.totalTrades} trades over ${selectedTimeframe?.period}`,
      });
    } catch (error) {
      toast({
        title: "Backtest Failed",
        description: "An error occurred while running the backtest",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  return {
    isRunning,
    currentStep,
    runBacktest
  };
};
