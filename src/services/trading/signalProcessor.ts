
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
        console.error('❌ CRITICAL: No authenticated user found - cannot initialize trade bridge');
        return false;
      }

      console.log('🔧 Creating trade bridge for LIVE trading...');
      this.tradeBridge = await SignalToTradeBridge.createFromSavedConfig(strategyId, user.id);
      
      if (!this.tradeBridge) {
        console.error('❌ CRITICAL: Failed to create trade bridge - NO TRADES WILL BE EXECUTED');
        console.error('🔧 Check OANDA configuration and ensure credentials are saved');
        return false;
      }

      console.log('✅ LIVE TRADE BRIDGE INITIALIZED - Ready to execute real trades');
      return true;
    } catch (error) {
      console.error('❌ CRITICAL ERROR initializing trade bridge:', error);
      return false;
    }
  }

  async processSignal(signal: ProcessedSignal): Promise<{ success: boolean; message: string; tradeExecuted: boolean }> {
    console.log('🎯 PROCESSING LIVE TRADE SIGNAL:', signal);
    
    if (!this.tradeBridge) {
      const errorMsg = 'CRITICAL: Trade bridge not initialized - CANNOT EXECUTE TRADES';
      console.error('❌', errorMsg);
      return { 
        success: false, 
        message: errorMsg, 
        tradeExecuted: false 
      };
    }

    try {
      console.log('🚀 EXECUTING LIVE TRADE through trade bridge...');

      // Convert to trade bridge format
      const strategySignal = {
        signal: signal.signal,
        symbol: signal.symbol,
        confidence: signal.confidence * 100, // Convert to percentage
        currentPrice: signal.currentPrice,
        strategyName: signal.strategyName
      };

      console.log('📊 Trade signal details:', strategySignal);

      // CRITICAL: Execute the LIVE TRADE
      const result = await this.tradeBridge.processSignal(strategySignal);
      
      // Log the execution result
      await this.logTradeExecution(signal, result);

      if (result.success) {
        console.log('✅ ✅ ✅ LIVE TRADE EXECUTED SUCCESSFULLY ✅ ✅ ✅');
        console.log('💰 Trade details:', result.message);
        if (result.tradeId) {
          console.log('🆔 Trade ID:', result.tradeId);
        }
      } else {
        console.log('❌ ❌ ❌ LIVE TRADE EXECUTION FAILED ❌ ❌ ❌');
        console.log('🔧 Failure reason:', result.message);
      }

      return {
        success: result.success,
        message: result.message,
        tradeExecuted: result.success
      };

    } catch (error) {
      const errorMessage = `LIVE TRADE PROCESSING ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
        log_type: result.success ? 'info' : 'error',
        message: `LIVE TRADE EXECUTION: ${signal.signal} ${signal.symbol} at ${signal.currentPrice} - ${result.message}`,
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
          trade_executed: result.success,
          live_trading: true
        } as any
      });
    } catch (error) {
      console.error('Failed to log trade execution:', error);
    }
  }
}
