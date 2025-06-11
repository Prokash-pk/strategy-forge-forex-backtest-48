
import { TradeExecutionDebugger } from '../trading/tradeExecutionDebugger';
import { PythonEnvironmentInitializer } from './pythonEnvironmentInitializer';
import { StrategyExecutorOptimized } from './strategyExecutorOptimized';

export class OptimizedExecutionManager {
  private static instance: OptimizedExecutionManager;
  private pyodide: any = null;
  private isInitialized = false;

  static getInstance(): OptimizedExecutionManager {
    if (!OptimizedExecutionManager.instance) {
      OptimizedExecutionManager.instance = new OptimizedExecutionManager();
    }
    return OptimizedExecutionManager.instance;
  }

  async initializePyodide(): Promise<void> {
    if (this.pyodide && this.isInitialized) {
      console.log('🐍 Optimized Pyodide already initialized');
      return;
    }

    try {
      this.pyodide = await PythonEnvironmentInitializer.initializePyodide();
      this.isInitialized = true;
      console.log('✅ Optimized Python environment ready with verified packages');
      
    } catch (error) {
      console.error('❌ Failed to initialize optimized Pyodide:', error);
      this.isInitialized = false;
      this.pyodide = null;
      throw error;
    }
  }

  async executePythonStrategy(strategyCode: string, marketData: any): Promise<any> {
    // Ensure initialization is complete
    await this.initializePyodide();
    
    if (!this.pyodide) {
      throw new Error('Pyodide not initialized');
    }

    return await StrategyExecutorOptimized.executeStrategy(this.pyodide, strategyCode, marketData);
  }

  reset(): void {
    this.pyodide = null;
    this.isInitialized = false;
    console.log('🔄 Optimized execution manager reset');
  }
}
