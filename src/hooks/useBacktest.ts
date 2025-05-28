
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      // Step 1: Fetch real market data
      setCurrentStep('Fetching real market data from Twelve Data...');
      console.log(`Fetching real data for ${strategy.symbol} with ${strategy.timeframe} timeframe`);
      
      const { data: fetchResponse, error: fetchError } = await supabase.functions.invoke('fetch-forex-data', {
        body: {
          symbol: strategy.symbol,
          interval: strategy.timeframe,
          outputsize: 5000
        }
      });

      if (fetchError) {
        console.error('Error fetching data:', fetchError);
        throw new Error(`Failed to fetch market data: ${fetchError.message}`);
      }

      if (!fetchResponse.success) {
        console.error('API error:', fetchResponse.error);
        throw new Error(fetchResponse.error || 'Failed to fetch market data');
      }

      const marketData = fetchResponse.data;
      console.log(`Fetched ${marketData.length} data points for ${strategy.symbol}`);

      if (marketData.length === 0) {
        throw new Error('No market data available for the selected symbol and timeframe');
      }

      // Step 2: Validate strategy code
      setCurrentStep('Validating strategy configuration...');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!strategy.code || strategy.code.trim().length === 0) {
        throw new Error('Strategy code is required');
      }

      // Step 3: Run backtest with real data
      setCurrentStep('Running backtest simulation with real market data...');
      console.log('Starting backtest execution...');

      const { data: backtestResponse, error: backtestError } = await supabase.functions.invoke('run-backtest', {
        body: {
          data: marketData,
          strategy: {
            code: strategy.code,
            name: strategy.name,
            initialBalance: strategy.initialBalance,
            riskPerTrade: strategy.riskPerTrade,
            stopLoss: strategy.stopLoss,
            takeProfit: strategy.takeProfit,
            spread: strategy.spread,
            commission: strategy.commission,
            slippage: strategy.slippage
          }
        }
      });

      if (backtestError) {
        console.error('Error running backtest:', backtestError);
        throw new Error(`Backtest execution failed: ${backtestError.message}`);
      }

      if (!backtestResponse.success) {
        console.error('Backtest error:', backtestResponse.error);
        throw new Error(backtestResponse.error || 'Backtest execution failed');
      }

      const results = backtestResponse.results;
      console.log(`Backtest completed: ${results.totalTrades} trades executed`);

      // Step 4: Complete
      setCurrentStep('Backtest completed successfully!');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update results with real data info
      const enhancedResults = {
        ...results,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        period: `Real Data (${marketData.length} bars)`,
        metadata: fetchResponse.metadata
      };

      onBacktestComplete(enhancedResults);
      
      toast({
        title: "Real Data Backtest Complete",
        description: `Strategy tested with ${results.totalTrades} trades on real ${strategy.symbol} data`,
      });

    } catch (error) {
      console.error('Backtest failed:', error);
      
      let errorMessage = 'An error occurred while running the backtest';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Backtest Failed",
        description: errorMessage,
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
