
import { supabase } from '@/integrations/supabase/client';
import { PythonExecutor } from '@/services/pythonExecutor';
import { StrategyStorage } from '@/services/strategyStorage';
import { BacktestStrategy, BacktestResults } from '@/types/backtest';
import { getTimeframeInfo } from '@/utils/timeframes';

export class BacktestExecutionService {
  static async executeStrategy(
    strategy: BacktestStrategy,
    marketData: any[],
    metadata: any,
    onStepUpdate: (step: string) => void
  ): Promise<BacktestResults> {
    // Step 3: Initialize Python execution environment
    onStepUpdate('Initializing enhanced Python execution environment...');
    
    const isPythonAvailable = await PythonExecutor.isAvailable();
    console.log(`Python execution ${isPythonAvailable ? 'enabled' : 'not available, using fallback'}`);

    // Step 4: Execute strategy with enhanced features
    onStepUpdate(isPythonAvailable ? 'Executing Python strategy with enhanced modeling...' : 'Running backtest simulation with pattern matching...');
    
    let backtestResponse;
    
    if (isPythonAvailable) {
      backtestResponse = await this.executePythonStrategy(strategy, marketData, onStepUpdate);
    } else {
      backtestResponse = await this.executeJavaScriptStrategy(strategy, marketData, onStepUpdate);
    }

    if (!backtestResponse.success) {
      console.error('Backtest error:', backtestResponse.error);
      throw new Error(backtestResponse.error || 'Backtest execution failed');
    }

    const results = backtestResponse.results;
    console.log(`Enhanced backtest completed: ${results.totalTrades} trades executed`);

    // Step 5: Save strategy results to database
    onStepUpdate('Saving enhanced strategy results...');
    await this.saveStrategyResults(strategy, results);

    // Step 6: Complete
    onStepUpdate('Enhanced backtest completed successfully!');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update results with real data info and enhanced metrics
    return {
      ...results,
      symbol: strategy.symbol,
      timeframe: strategy.timeframe,
      period: `Real Data (${marketData.length} bars)`,
      metadata: metadata,
      executionMethod: isPythonAvailable ? 'Enhanced Python' : 'JavaScript Pattern Matching',
      enhancedFeatures: {
        dynamicSpreads: isPythonAvailable,
        realisticSlippage: isPythonAvailable,
        advancedPositionSizing: true,
        marketImpact: isPythonAvailable
      }
    };
  }

  private static async executePythonStrategy(strategy: BacktestStrategy, marketData: any[], onStepUpdate: (step: string) => void) {
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
    }
    
    // Get timeframe info for accurate duration calculation
    const timeframeInfo = getTimeframeInfo(strategy.timeframe);
    
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
    
    if (error) throw new Error(`Enhanced backtest execution failed: ${error.message}`);
    return response;
  }

  private static async executeJavaScriptStrategy(strategy: BacktestStrategy, marketData: any[], onStepUpdate: (step: string) => void) {
    console.log('Using JavaScript pattern matching for strategy');
    
    const timeframeInfo = getTimeframeInfo(strategy.timeframe);
    
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
    
    if (error) throw new Error(`Backtest execution failed: ${error.message}`);
    return response;
  }

  private static async saveStrategyResults(strategy: BacktestStrategy, results: any) {
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
  }
}
