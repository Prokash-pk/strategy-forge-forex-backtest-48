
import { supabase } from '@/integrations/supabase/client';
import { SignalToTradeBridge } from './signalToTradeBridge';

export interface ProcessedSignal {
  signal: 'BUY' | 'SELL' | 'CLOSE' | 'NONE';
  symbol: string;
  currentPrice: number;
  timestamp: string;
  confidence: number;
  strategyName: string;
}

export class SignalProcessor {
  private static instance: SignalProcessor;
  private tradeBridge: SignalToTradeBridge | null = null;

  static getInstance(): SignalProcessor {
    if (!SignalProcessor.instance) {
      SignalProcessor.instance = new SignalProcessor();
    }
    return SignalProcessor.instance;
  }

  async initializeTradeBridge(strategyId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No authenticated user found');
        return false;
      }

      this.tradeBridge = await SignalToTradeBridge.createFromSavedConfig(strategyId, user.id);
      
      if (!this.tradeBridge) {
        console.error('❌ Failed to create trade bridge - check OANDA configuration');
        return false;
      }

      console.log('✅ Trade bridge initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing trade bridge:', error);
      return false;
    }
  }

  async processSignal(signal: ProcessedSignal): Promise<{ success: boolean; message: string; tradeExecuted: boolean }> {
    if (!this.tradeBridge) {
      console.error('❌ Trade bridge not initialized');
      return { 
        success: false, 
        message: 'Trade bridge not initialized - cannot execute trades', 
        tradeExecuted: false 
      };
    }

    try {
      console.log('🔄 Processing signal for trade execution:', signal);

      // Convert to trade bridge format
      const strategySignal = {
        signal: signal.signal,
        symbol: signal.symbol,
        confidence: signal.confidence * 100, // Convert to percentage
        currentPrice: signal.currentPrice,
        strategyName: signal.strategyName
      };

      // Execute the trade
      const result = await this.tradeBridge.processSignal(strategySignal);
      
      // Log the execution result
      await this.logTradeExecution(signal, result);

      if (result.success) {
        console.log('✅ REAL TRADE EXECUTED:', result.message);
        console.log('💰 Trade ID:', result.tradeId);
      } else {
        console.log('❌ Trade execution failed:', result.message);
      }

      return {
        success: result.success,
        message: result.message,
        tradeExecuted: result.success
      };

    } catch (error) {
      const errorMessage = `Signal processing error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMessage);
      
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
        log_type: result.success ? 'trade_execution' : 'trade_error',
        message: `SIGNAL PROCESSING: ${signal.signal} ${signal.symbol} at ${signal.currentPrice} - ${result.message}`,
        trade_data: {
          signal_data: {
            signal: signal.signal,
            symbol: signal.symbol,
            currentPrice: signal.currentPrice,
            timestamp: signal.timestamp,
            confidence: signal.confidence,
            strategyName: signal.strategyName
          },
          execution_result: {
            success: result.success,
            message: result.message,
            tradeId: result.tradeId
          },
          timestamp: new Date().toISOString(),
          trade_executed: result.success
        } as any
      });
    } catch (error) {
      console.error('Failed to log trade execution:', error);
    }
  }
}
