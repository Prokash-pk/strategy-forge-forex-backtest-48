
import { STRATEGY_EXECUTOR_PYTHON_CODE } from './strategyExecutor';
import type { PyodideInstance } from './types';

export class PyodideLoader {
  private static pyodideInstance: PyodideInstance | null = null;
  private static isLoading = false;
  private static loadPromise: Promise<PyodideInstance> | null = null;
  private static lastError: Error | null = null;

  static async initialize(): Promise<PyodideInstance> {
    if (this.pyodideInstance) {
      console.log('🐍 Returning existing Pyodide instance');
      // Re-run the strategy executor code to ensure execute_strategy is available
      try {
        this.pyodideInstance.runPython(STRATEGY_EXECUTOR_PYTHON_CODE);
        console.log('🐍 Re-initialized strategy executor code in existing instance');
      } catch (error) {
        console.warn('🐍 Failed to re-initialize strategy code, creating new instance:', error);
        this.pyodideInstance = null;
        this.loadPromise = null;
      }
      
      if (this.pyodideInstance) {
        return this.pyodideInstance;
      }
    }

    if (this.isLoading && this.loadPromise) {
      console.log('🐍 Waiting for existing Pyodide load process...');
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this.loadPyodideInternal();
    
    try {
      this.pyodideInstance = await this.loadPromise;
      this.lastError = null;
      console.log('🐍 Pyodide successfully initialized and cached');
      return this.pyodideInstance;
    } catch (error) {
      console.error('🐍 Failed to initialize Pyodide:', error);
      this.lastError = error instanceof Error ? error : new Error('Unknown Pyodide error');
      throw this.lastError;
    } finally {
      this.isLoading = false;
    }
  }

  private static async loadPyodideInternal(): Promise<PyodideInstance> {
    try {
      // Load Pyodide from CDN with better error handling
      if (typeof window !== 'undefined' && !window.loadPyodide) {
        console.log('🐍 Loading Pyodide script from CDN...');
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
          script.onload = () => {
            console.log('🐍 Pyodide script loaded successfully');
            resolve();
          };
          script.onerror = () => {
            console.error('🐍 Failed to load Pyodide script');
            reject(new Error('Failed to load Pyodide script from CDN'));
          };
          document.head.appendChild(script);
        });
      }

      console.log('🐍 Initializing Pyodide runtime...');
      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        fullStdLib: false // Load only essential stdlib to reduce size
      });

      // Install required packages with retry logic
      console.log('🐍 Installing Python packages...');
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await pyodide.loadPackage(['numpy', 'pandas']);
          console.log('🐍 Python packages installed successfully');
          break;
        } catch (packageError) {
          retryCount++;
          console.warn(`🐍 Package installation attempt ${retryCount} failed:`, packageError);
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to install Python packages after ${maxRetries} attempts`);
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Set up the Python environment with helper functions
      console.log('🐍 Setting up Python strategy execution environment...');
      pyodide.runPython(STRATEGY_EXECUTOR_PYTHON_CODE);

      // Test that execute_strategy function is available
      console.log('🐍 Testing Python environment...');
      const testResult = pyodide.runPython(`
import numpy as np
import pandas as pd

# Check if execute_strategy function exists
if 'execute_strategy' in globals():
    print("✅ execute_strategy function found and ready")
    result = "success_with_execute_strategy"
else:
    print("❌ execute_strategy function not found")
    print(f"Available functions: {[name for name in globals().keys() if callable(globals()[name]) and not name.startswith('_')]}")
    result = "missing_execute_strategy"

result
      `);

      if (testResult !== "success_with_execute_strategy") {
        throw new Error('Python environment test failed: execute_strategy function not available after initialization');
      }

      console.log('🐍 Pyodide fully initialized with execute_strategy function ready');
      return pyodide as PyodideInstance;

    } catch (error) {
      console.error('🐍 Critical error during Pyodide initialization:', error);
      throw error instanceof Error ? error : new Error('Unknown Pyodide initialization error');
    }
  }

  static async isAvailable(): Promise<boolean> {
    try {
      // Quick check if we already have a working instance
      if (this.pyodideInstance) {
        // Verify execute_strategy is still available
        try {
          const checkResult = this.pyodideInstance.runPython(`
'execute_strategy' in globals()
          `);
          if (checkResult) {
            console.log('🐍 Pyodide already available with execute_strategy function');
            return true;
          } else {
            console.log('🐍 Pyodide instance exists but execute_strategy missing, reinitializing...');
            this.pyodideInstance = null;
            this.loadPromise = null;
          }
        } catch (checkError) {
          console.warn('🐍 Failed to check execute_strategy availability:', checkError);
          this.pyodideInstance = null;
          this.loadPromise = null;
        }
      }

      // If we had a previous error, try to clear it and reinitialize
      if (this.lastError) {
        console.log('🐍 Previous error detected, attempting fresh initialization...');
        this.lastError = null;
        this.pyodideInstance = null;
        this.loadPromise = null;
      }

      // Try to initialize with timeout
      console.log('🐍 Testing Pyodide availability...');
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Pyodide availability check timeout')), 30000);
      });

      await Promise.race([this.initialize(), timeoutPromise]);
      console.log('🐍 Pyodide availability check passed');
      return true;
    } catch (error) {
      console.error('🐍 Pyodide availability check failed:', error);
      return false;
    }
  }

  static getLastError(): Error | null {
    return this.lastError;
  }

  static reset(): void {
    console.log('🐍 Resetting Pyodide loader state');
    this.pyodideInstance = null;
    this.isLoading = false;
    this.loadPromise = null;
    this.lastError = null;
  }
}
