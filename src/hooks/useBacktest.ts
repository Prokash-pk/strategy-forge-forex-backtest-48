
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PythonExecutor } from '@/services/pythonExecutor';
import { StrategyStorage } from '@/services/strategyStorage';

export const useBacktest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();

  const timeframes = [
    { value: '1m', label: '1 Minute', period: '7 days', dataPoints: 10080, minutesPerBar: 1 },
    { value: '5m', label: '5 Minutes', period: '60 days', dataPoints: 17280, minutesPerBar: 5 },
    { value: '15m', label: '15 Minutes', period: '60 days', dataPoints: 5760, minutesPerBar: 15 },
    { value: '1h', label: '1 Hour', period: '730 days', dataPoints: 17520, minutesPerBar: 60 },
    { value: '1d', label: '1 Day', period: '5 years', dataPoints: 1825, minutesPerBar: 1440 }
  ];

  const runBacktest = async (strategy: any, onBacktestComplete: (results: any) => void) => {
    setIsRunning(true);
    
    try {
      // Step 1: Validate strategy parameters
      setCurrentStep('Validating enhanced strategy parameters...');
      
      if (!strategy.code || strategy.code.trim().length === 0) {
        throw new Error('Strategy code is required');
      }
      
      if (strategy.riskPerTrade <= 0 || strategy.riskPerTrade > 100) {
        throw new Error('Risk per trade must be between 0 and 100%');
      }

      // Step 2: Fetch real market data
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

      // Step 3: Initialize Python execution environment
      setCurrentStep('Initializing enhanced Python execution environment...');
      
      const isPythonAvailable = await PythonExecutor.isAvailable();
      console.log(`Python execution ${isPythonAvailable ? 'enabled' : 'not available, using fallback'}`);

      // Step 4: Execute strategy with enhanced features
      setCurrentStep(isPythonAvailable ? 'Executing Python strategy with enhanced modeling...' : 'Running backtest simulation with pattern matching...');
      
      let backtestResponse;
      
      if (isPythonAvailable) {
        // Use Python execution
        console.log('Using enhanced Python execution for strategy');
        
        // Prepare market data for Python with proper data structure
        const pythonMarketData = {
          open: marketData.map((d: any) => parseFloat(d.open)),
          high: marketData.map((d: any) => parseFloat(d.high)),
          low: marketData.map((d: any) => parseFloat(d.low)),
          close: marketData.map((d: any) => parseFloat(d.close)),
          volume: marketData.map((d: any) => parseFloat(d.volume || 0))
        };
        
        // Execute strategy with Python
        const strategyResult = await PythonExecutor.executeStrategy(strategy.code, pythonMarketData);
        
        if (strategyResult.error) {
          console.warn('Python execution error, falling back to pattern matching:', strategyResult.error);
          toast({
            title: "Python Execution Warning",
            description: `Strategy had errors: ${strategyResult.error}. Using fallback execution.`,
            variant: "destructive",
          });
        }
        
        // Get timeframe info for accurate duration calculation
        const timeframeInfo = timeframes.find(tf => tf.value === strategy.timeframe);
        
        // Run enhanced backtest with Python-generated signals and timeframe info
        const { data: response, error } = await supabase.functions.invoke('run-backtest', {
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
              slippage: strategy.slippage,
              maxPositionSize: strategy.maxPositionSize,
              riskModel: strategy.riskModel
            },
            pythonSignals: strategyResult.error ? undefined : strategyResult,
            timeframeInfo: timeframeInfo,
            enhancedMode: true // Enable enhanced backtest features
          }
        });
        
        backtestResponse = response;
        if (error) throw new Error(`Enhanced backtest execution failed: ${error.message}`);
        
      } else {
        // Fallback to existing JavaScript pattern matching
        console.log('Using JavaScript pattern matching for strategy');
        
        const timeframeInfo = timeframes.find(tf => tf.value === strategy.timeframe);
        
        const { data: response, error } = await supabase.functions.invoke('run-backtest', {
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
              slippage: strategy.slippage,
              maxPositionSize: strategy.maxPositionSize,
              riskModel: strategy.riskModel
            },
            timeframeInfo: timeframeInfo,
            enhancedMode: false
          }
        });
        
        backtestResponse = response;
        if (error) throw new Error(`Backtest execution failed: ${error.message}`);
      }

      if (!backtestResponse.success) {
        console.error('Backtest error:', backtestResponse.error);
        throw new Error(backtestResponse.error || 'Backtest execution failed');
      }

      const results = backtestResponse.results;
      console.log(`Enhanced backtest completed: ${results.totalTrades} trades executed`);

      // Step 5: Save strategy results to database
      setCurrentStep('Saving enhanced strategy results...');
      
      try {
        await StrategyStorage.saveStrategyResult({
          strategy_name: strategy.name,
          strategy_code: strategy.code,
          symbol: strategy.symbol,
          timeframe: strategy.timeframe,
          win_rate: results.winRate,
          total_return: results.totalReturn,
          total_trades: results.totalTrades,
          profit_factor: results.profitFactor,
          max_drawdown: results.maxDrawdown
        });
        
        console.log('Enhanced strategy results saved to database');
      } catch (saveError) {
        console.warn('Failed to save strategy results:', saveError);
        // Don't fail the backtest if saving fails
      }

      // Step 6: Complete
      setCurrentStep('Enhanced backtest completed successfully!');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update results with real data info and enhanced metrics
      const enhancedResults = {
        ...results,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        period: `Real Data (${marketData.length} bars)`,
        metadata: fetchResponse.metadata,
        executionMethod: isPythonAvailable ? 'Enhanced Python' : 'JavaScript Pattern Matching',
        enhancedFeatures: {
          dynamicSpreads: isPythonAvailable,
          realisticSlippage: isPythonAvailable,
          advancedPositionSizing: true,
          marketImpact: isPythonAvailable
        }
      };

      onBacktestComplete(enhancedResults);

    } catch (error) {
      console.error('Enhanced backtest failed:', error);
      
      let errorMessage = 'An error occurred while running the enhanced backtest';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Enhanced Backtest Failed",
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
