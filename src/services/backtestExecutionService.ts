
import { BacktestStrategy } from '@/types/backtest';
import { supabase } from '@/integrations/supabase/client';

export class BacktestExecutionService {
  static async executeStrategy(
    strategy: BacktestStrategy,
    marketData: any,
    metadata: any,
    setCurrentStep: (step: string) => void
  ) {
    // Step 3: Execute Python strategy
    setCurrentStep('Executing Python strategy analysis...');
    const { OptimizedExecutionManager } = await import('@/services/python/optimizedExecutionManager');
    const executionManager = OptimizedExecutionManager.getInstance();
    const executionResult = await executionManager.executePythonStrategy(strategy.code, marketData);

    // Step 4: Run enhanced backtest with risk management
    setCurrentStep('Running enhanced backtest with adaptive risk management...');
    
    const requestBody = {
      data: marketData.map((item: any) => ({
        date: item.datetime,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume || 0)
      })),
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
        riskModel: strategy.riskModel,
        reverseSignals: strategy.reverseSignals || false,
        positionSizingMode: strategy.positionSizingMode || 'manual',
        riskRewardRatio: strategy.riskRewardRatio || 1.5
      },
      pythonSignals: executionResult.success ? executionResult.signals : undefined,
      timeframeInfo: {
        minutes: metadata.timeframeMinutes || 15,
        description: metadata.timeframeDescription || '15 minutes'
      },
      enhancedMode: true
    };

    console.log('🚀 Sending backtest request with body:', JSON.stringify(requestBody, null, 2));

    const { data: results, error } = await supabase.functions.invoke('run-backtest', {
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      console.error('❌ Backtest execution error:', error);
      throw new Error(`Backtest failed: ${error.message}`);
    }

    if (!results?.success) {
      console.error('❌ Backtest returned error:', results);
      throw new Error(results?.error || 'Backtest execution failed');
    }

    // Step 5: Process and return results
    setCurrentStep('Processing backtest results...');
    console.log('✅ Backtest completed successfully:', results.results);

    return {
      ...results.results,
      metadata: {
        ...metadata,
        executionMethod: results.results.executionMethod || 'Enhanced',
        enhancedFeatures: {
          dynamicSpreads: true,
          realisticSlippage: true,
          advancedPositionSizing: true,
          marketImpact: true
        }
      }
    };
  }
}
