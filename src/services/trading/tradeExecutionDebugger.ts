import { supabase } from '@/integrations/supabase/client';

export class TradeExecutionDebugger {
  static async logExecutionStep(step: string, data: any, userId?: string) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      step,
      data,
      userId
    };
    
    console.log(`🔍 TRADE DEBUG [${step}]:`, data);
    
    // Store in localStorage for debugging
    const existingLogs = JSON.parse(localStorage.getItem('trade_debug_logs') || '[]');
    existingLogs.push(logEntry);
    
    // Keep only last 50 logs
    if (existingLogs.length > 50) {
      existingLogs.splice(0, existingLogs.length - 50);
    }
    
    localStorage.setItem('trade_debug_logs', JSON.stringify(existingLogs));

    // Also log to database if user provided
    if (userId) {
      try {
        await supabase.from('trading_logs').insert({
          user_id: userId,
          session_id: crypto.randomUUID(),
          log_type: 'debug',
          message: `DEBUG: ${step}`,
          trade_data: {
            debug_step: step,
            debug_data: data,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Failed to log debug info to database:', error);
      }
    }
  }

  static getDebugLogs() {
    return JSON.parse(localStorage.getItem('trade_debug_logs') || '[]');
  }

  static clearDebugLogs() {
    localStorage.removeItem('trade_debug_logs');
    console.log('🗑️ Debug logs cleared');
  }

  static async analyzeLastStrategy(strategyCode: string, marketData: any) {
    console.log('🧠 ANALYZING STRATEGY EXECUTION...');
    
    this.logExecutionStep('STRATEGY_INPUT', {
      strategyCodeLength: strategyCode?.length || 0,
      hasStrategyCode: !!strategyCode,
      marketDataKeys: Object.keys(marketData || {}),
      marketDataLength: marketData?.close?.length || 0
    });

    try {
      // Import the Python executor
      const { PythonExecutor } = await import('../pythonExecutor');
      
      console.log('📊 Executing strategy with market data...');
      const result = await PythonExecutor.executeStrategy(strategyCode, marketData);
      
      this.logExecutionStep('STRATEGY_RESULT', {
        hasResult: !!result,
        resultKeys: Object.keys(result || {}),
        entrySignals: result?.entry?.filter?.(Boolean)?.length || 0,
        exitSignals: result?.exit?.filter?.(Boolean)?.length || 0,
        directions: result?.direction || [],
        lastEntrySignal: result?.entry?.[result.entry.length - 1],
        lastDirection: result?.direction?.[result.direction.length - 1],
        error: result?.error
      });

      return result;
    } catch (error) {
      this.logExecutionStep('STRATEGY_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name
      });
      throw error;
    }
  }
}

// Bind to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).tradeDebugger = TradeExecutionDebugger;
  console.log('🐛 Trade debugger available: tradeDebugger.getDebugLogs()');
}
