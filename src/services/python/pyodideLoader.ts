
import { STRATEGY_EXECUTOR_PYTHON_CODE } from './strategyExecutor';
import type { PyodideInstance } from './types';

export class PyodideLoader {
  private static pyodideInstance: PyodideInstance | null = null;
  private static isLoading = false;
  private static loadPromise: Promise<PyodideInstance> | null = null;
  private static lastError: Error | null = null;
  private static isEnvironmentReady = false;

  static async initialize(): Promise<PyodideInstance> {
    if (this.pyodideInstance && this.isEnvironmentReady) {
      console.log('🐍 Using existing ready Pyodide instance');
      return this.pyodideInstance;
    }

    if (this.isLoading && this.loadPromise) {
      console.log('🐍 Waiting for existing Pyodide load process...');
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this.loadPyodideInternal();
    
    try {
      this.pyodideInstance = await this.loadPromise;
      await this.ensureEnvironmentReady();
      this.lastError = null;
      console.log('🐍 Pyodide successfully initialized and ready');
      return this.pyodideInstance;
    } catch (error) {
      console.error('🐍 Failed to initialize Pyodide:', error);
      this.lastError = error instanceof Error ? error : new Error('Unknown Pyodide error');
      this.reset();
      throw this.lastError;
    } finally {
      this.isLoading = false;
    }
  }

  private static async ensureEnvironmentReady(): Promise<void> {
    if (!this.pyodideInstance) {
      throw new Error('Pyodide instance not available');
    }

    console.log('🔧 Ensuring Python environment is ready...');
    
    // Force reload the strategy executor code
    this.pyodideInstance.runPython(STRATEGY_EXECUTOR_PYTHON_CODE);
    
    // Verify execute_strategy is available
    const checkResult = this.pyodideInstance.runPython(`
try:
    if 'execute_strategy' in globals():
        print("✅ execute_strategy function verified")
        True
    else:
        print("❌ execute_strategy function missing after reload")
        False
except Exception as e:
    print(f"❌ Error verifying execute_strategy: {e}")
    False
    `);
    
    if (!checkResult) {
      this.isEnvironmentReady = false;
      throw new Error('Failed to initialize execute_strategy function');
    }
    
    this.isEnvironmentReady = true;
    console.log('✅ Python environment verified and ready');
  }

  static async reinitializeEnvironment(pyodideInstance: PyodideInstance): Promise<void> {
    console.log('🔄 Force reinitializing Python environment...');
    this.isEnvironmentReady = false;
    
    try {
      // Re-run the strategy executor code
      pyodideInstance.runPython(STRATEGY_EXECUTOR_PYTHON_CODE);
      
      // Verify execute_strategy is now available
      const checkResult = pyodideInstance.runPython(`
try:
    if 'execute_strategy' in globals():
        print("✅ execute_strategy function restored")
        True
    else:
        print("❌ execute_strategy function still missing")
        print(f"Available globals: {[k for k in globals().keys() if not k.startswith('_')]}")
        False
except Exception as e:
    print(f"❌ Error checking execute_strategy: {e}")
    False
      `);
      
      if (!checkResult) {
        throw new Error('execute_strategy function still not available after reinitialization');
      }
      
      this.isEnvironmentReady = true;
      console.log('✅ Python environment successfully reinitialized');
    } catch (error) {
      console.error('❌ Failed to reinitialize Python environment:', error);
      this.isEnvironmentReady = false;
      throw error;
    }
  }

  private static async loadPyodideInternal(): Promise<PyodideInstance> {
    try {
      // Load Pyodide from CDN
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
        fullStdLib: false
      });

      // Install required packages
      console.log('🐍 Installing Python packages...');
      await pyodide.loadPackage(['numpy', 'pandas']);
      console.log('🐍 Python packages installed successfully');

      console.log('🐍 Pyodide runtime initialized successfully');
      return pyodide as PyodideInstance;

    } catch (error) {
      console.error('🐍 Critical error during Pyodide initialization:', error);
      throw error instanceof Error ? error : new Error('Unknown Pyodide initialization error');
    }
  }

  static async isAvailable(): Promise<boolean> {
    try {
      if (this.pyodideInstance && this.isEnvironmentReady) {
        console.log('🐍 Pyodide already available and ready');
        return true;
      }

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
    this.isEnvironmentReady = false;
  }
}
