
import { PyodideManager } from './pyodideManager';
import { TradeExecutionDebugger } from '../trading/tradeExecutionDebugger';
import { PYTHON_STRATEGY_SETUP_CODE, PYTHON_DATA_SETUP_CODE } from './pythonEnvironmentSetup';
import { MarketDataProcessor } from './marketDataProcessor';
import { PythonResultProcessor } from './resultProcessor';

export class EnhancedExecutionManager {
  private static instance: EnhancedExecutionManager;
  private pyodide: any = null;
  private isInitialized = false;

  static getInstance(): EnhancedExecutionManager {
    if (!EnhancedExecutionManager.instance) {
      EnhancedExecutionManager.instance = new EnhancedExecutionManager();
    }
    return EnhancedExecutionManager.instance;
  }

  async initializePyodide(): Promise<void> {
    if (this.pyodide && this.isInitialized) {
      console.log('🐍 Pyodide already initialized');
      return;
    }

    await TradeExecutionDebugger.logExecutionStep('PYODIDE_INIT_START', {
      timestamp: new Date().toISOString()
    });
    
    this.pyodide = await PyodideManager.getInstance().getPyodide();
    
    console.log('🐍 Setting up Python strategy execution environment...');
    await this.pyodide.runPython(PYTHON_STRATEGY_SETUP_CODE);
    
    // Test that the function was created
    const functionExists = await this.pyodide.runPython(`
'execute_strategy' in globals() and callable(execute_strategy)
`);
    
    if (!functionExists) {
      throw new Error('Failed to create execute_strategy function');
    }
    
    this.isInitialized = true;
    
    await TradeExecutionDebugger.logExecutionStep('PYODIDE_INIT_COMPLETE', {
      initialized: !!this.pyodide,
      functionExists,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Python environment fully initialized');
  }

  async executePythonStrategy(strategyCode: string, marketData: any): Promise<any> {
    try {
      await TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTION_START', {
        strategyCodeLength: strategyCode?.length || 0,
        marketDataKeys: Object.keys(marketData || {}),
        dataPoints: marketData?.close?.length || 0,
        sampleCloseData: marketData?.close?.slice(-5) || []
      });

      await this.initializePyodide();
      
      if (!this.pyodide) {
        throw new Error('Pyodide not initialized');
      }

      // Set market data and log info
      MarketDataProcessor.setMarketDataInPython(this.pyodide, marketData);
      MarketDataProcessor.logMarketDataInfo(marketData);

      await TradeExecutionDebugger.logExecutionStep('PYTHON_DATA_SET', {
        openLength: marketData.open?.length || 0,
        highLength: marketData.high?.length || 0,
        lowLength: marketData.low?.length || 0,
        closeLength: marketData.close?.length || 0,
        volumeLength: marketData.volume?.length || 0
      });

      // Set the strategy code as a global variable
      this.pyodide.globals.set('strategy_code', strategyCode);
      
      // Execute data setup
      await this.pyodide.runPython(PYTHON_DATA_SETUP_CODE);

      // Execute the strategy with enhanced error handling
      const result = await this.pyodide.runPython(`
try:
    strategy_result = execute_strategy(data)
    print(f"🎯 Strategy result type: {type(strategy_result)}")
    if isinstance(strategy_result, dict):
        print(f"📊 Result keys: {list(strategy_result.keys())}")
        if 'entry' in strategy_result:
            entry_signals = sum(1 for x in strategy_result['entry'] if x) if strategy_result['entry'] else 0
            print(f"🚨 Entry signals found: {entry_signals}")
        if 'direction' in strategy_result:
            directions = [str(d) for d in strategy_result['direction'] if d and str(d) != 'None']
            unique_dirs = set(directions)
            print(f"🎯 Directions found: {unique_dirs}")
    strategy_result
except Exception as e:
    print(f"❌ Final execution error: {e}")
    import traceback
    traceback.print_exc()
    {
        'entry': [False] * len(data['close']) if len(data['close']) > 0 else [False] * 100,
        'exit': [False] * len(data['close']) if len(data['close']) > 0 else [False] * 100,
        'direction': [None] * len(data['close']) if len(data['close']) > 0 else [None] * 100,
        'error': str(e)
    }
`);

      const jsResult = PythonResultProcessor.processExecutionResult(result);
      
      await TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTION_COMPLETE', {
        hasResult: !!jsResult,
        resultKeys: Object.keys(jsResult || {}),
        entrySignalsCount: jsResult?.entry?.filter?.(Boolean)?.length || 0,
        exitSignalsCount: jsResult?.exit?.filter?.(Boolean)?.length || 0,
        lastEntrySignal: jsResult?.entry?.[jsResult.entry.length - 1],
        lastDirection: jsResult?.direction?.[jsResult.direction.length - 1],
        error: jsResult?.error
      });

      return jsResult;

    } catch (error) {
      await TradeExecutionDebugger.logExecutionStep('PYTHON_EXECUTION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name
      });
      
      throw new Error(`Python execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  reset(): void {
    this.pyodide = null;
    this.isInitialized = false;
    console.log('🔄 Enhanced execution manager reset');
  }
}

// Bind to window for debugging
if (typeof window !== 'undefined') {
  (window as any).enhancedPythonExecutor = EnhancedExecutionManager.getInstance();
  console.log('🐍 Enhanced Python executor available: enhancedPythonExecutor');
}
