
import { supabase } from '@/integrations/supabase/client';
import { SignalToTradeBridge } from './signalToTradeBridge';
import { TradeExecutionDebugger } from './tradeExecutionDebugger';

export interface ProcessedSignal {
  signal: 'BUY' | 'SELL' | 'CLOSE' | 'NONE';
  symbol: string;
  currentPrice: number;
  timestamp: string;
  confidence: number;
  strategyName: string;
}

export class EnhancedSignalProcessor {
  private static instance: EnhancedSignalProcessor;
  private tradeBridge: SignalToTradeBridge | null = null;

  static getInstance(): EnhancedSignalProcessor {
    if (!EnhancedSignalProcessor.instance) {
      EnhancedSignalProcessor.instance = new EnhancedSignalProcessor();
    }
    return EnhancedSignalProcessor.instance;
  }

  async initializeTradeBridge(strategyId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await TradeExecutionDebugger.logExecutionStep('BRIDGE_INIT_ERROR', {
          error: 'No authenticated user found',
          critical: true
        });
        return false;
      }

      await TradeExecutionDebugger.logExecutionStep('BRIDGE_INIT_START', {
        strategyId,
        userId: user.id
      }, user.id);

      this.tradeBridge = await SignalToTradeBridge.createFromSavedConfig(strategyId, user.id);
      
      const success = !!this.tradeBridge;
      await TradeExecutionDebugger.logExecutionStep('BRIDGE_INIT_RESULT', {
        success,
        bridgeCreated: success
      }, user.id);

      return success;
    } catch (error) {
      await TradeExecutionDebugger.logExecutionStep('BRIDGE_INIT_EXCEPTION', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async processSignal(signal: ProcessedSignal): Promise<{ success: boolean; message: string; tradeExecuted: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    await TradeExecutionDebugger.logExecutionStep('SIGNAL_RECEIVED', {
      signal: signal.signal,
      symbol: signal.symbol,
      confidence: signal.confidence,
      currentPrice: signal.currentPrice,
      strategyName: signal.strategyName,
      hasTradeBridge: !!this.tradeBridge
    }, user?.id);

    if (!this.tradeBridge) {
      const errorMsg = 'Trade bridge not initialized - cannot execute trades';
      await TradeExecutionDebugger.logExecutionStep('BRIDGE_NOT_INITIALIZED', {
        error: errorMsg,
        critical: true
      }, user?.id);
      
      return { 
        success: false, 
        message: errorMsg, 
        tradeExecuted: false 
      };
    }

    try {
      // Convert to trade bridge format
      const strategySignal = {
        signal: signal.signal,
        symbol: signal.symbol,
        confidence: signal.confidence * 100,
        currentPrice: signal.currentPrice,
        strategyName: signal.strategyName
      };

      await TradeExecutionDebugger.logExecutionStep('SIGNAL_PROCESSING', {
        convertedSignal: strategySignal,
        confidencePercentage: strategySignal.confidence
      }, user?.id);

      // Execute the trade
      const result = await this.tradeBridge.processSignal(strategySignal);
      
      await TradeExecutionDebugger.logExecutionStep('TRADE_EXECUTION_RESULT', {
        success: result.success,
        message: result.message,
        tradeId: result.tradeId,
        executed: result.success
      }, user?.id);

      // Log the execution result
      await this.logTradeExecution(signal, result);

      return {
        success: result.success,
        message: result.message,
        tradeExecuted: result.success
      };

    } catch (error) {
      const errorMessage = `Trade processing error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      await TradeExecutionDebugger.logExecutionStep('TRADE_PROCESSING_ERROR', {
        error: errorMessage,
        errorType: error?.constructor?.name
      }, user?.id);
      
      await this.logTradeExecution(signal, { success: false, message: errorMessage });
      
      return {
        success: false,
        message: errorMessage,
        tradeExecuted: false
      };
    }
  }

  private async logTradeExecution(signal: ProcessedSignal, result: { success: boolean; message: string; tradeId?: string }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('trading_logs').insert({
        user_id: user.id,
        session_id: crypto.randomUUID(),
        log_type: result.success ? 'info' : 'error',
        message: `TRADE EXECUTION: ${signal.signal} ${signal.symbol} at ${signal.currentPrice} - ${result.message}`,
        trade_data: {
          signal_data: signal,
          execution_result: result,
          timestamp: new Date().toISOString(),
          trade_executed: result.success,
          live_trading: true,
          debug_info: {
            confidence_met: signal.confidence >= 0.7,
            signal_type: signal.signal,
            price_valid: signal.currentPrice > 0
          }
        } as any
      });
    } catch (error) {
      console.error('Failed to log trade execution:', error);
    }
  }

  // Method to test signal generation manually
  async testSignalGeneration(strategyCode: string, marketData: any): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    
    await TradeExecutionDebugger.logExecutionStep('MANUAL_SIGNAL_TEST', {
      hasStrategyCode: !!strategyCode,
      marketDataAvailable: !!marketData,
      dataPoints: marketData?.close?.length || 0
    }, user?.id);

    return await TradeExecutionDebugger.analyzeLastStrategy(strategyCode, marketData);
  }
}

// Bind to window for debugging
if (typeof window !== 'undefined') {
  (window as any).enhancedSignalProcessor = EnhancedSignalProcessor.getInstance();
  console.log('🎯 Enhanced signal processor available: enhancedSignalProcessor');
}
