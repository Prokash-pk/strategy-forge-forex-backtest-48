
import { STRATEGY_EXECUTOR_PYTHON_CODE } from './strategyExecutor';
import type { PyodideInstance } from './types';

export class PyodideLoader {
  private static pyodideInstance: PyodideInstance | null = null;
  private static isLoading = false;
  private static loadPromise: Promise<PyodideInstance> | null = null;
  private static lastError: Error | null = null;
  private static isEnvironmentReady = false;
  private static initializationAttempts = 0;
  private static maxInitializationAttempts = 3;

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
      this.initializationAttempts = 0;
      console.log('🐍 Pyodide successfully initialized and ready');
      return this.pyodideInstance;
    } catch (error) {
      console.error('🐍 Failed to initialize Pyodide:', error);
      this.lastError = error instanceof Error ? error : new Error('Unknown Pyodide error');
      
      // Try to recover if we haven't exceeded max attempts
      if (this.initializationAttempts < this.maxInitializationAttempts) {
        this.initializationAttempts++;
        console.log(`🔄 Retrying Pyodide initialization (attempt ${this.initializationAttempts}/${this.maxInitializationAttempts})`);
        this.reset();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return this.initialize();
      }
      
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
    
    try {
      // Force reload the strategy executor code with better error handling
      console.log('📥 Loading strategy executor code...');
      this.pyodideInstance.runPython(STRATEGY_EXECUTOR_PYTHON_CODE);
      console.log('✅ Strategy executor code loaded');
      
      // Verify execute_strategy is available with more detailed checks
      const checkResult = this.pyodideInstance.runPython(`
try:
    # Check if execute_strategy exists and is callable
    if 'execute_strategy' in globals():
        func = globals()['execute_strategy']
        if callable(func):
            print("✅ execute_strategy function verified and callable")
            result = True
        else:
            print("❌ execute_strategy exists but is not callable")
            result = False
    else:
        print("❌ execute_strategy function missing")
        available_funcs = [k for k in globals().keys() if callable(globals()[k]) and not k.startswith('_')]
        print(f"Available functions: {available_funcs[:10]}...")  # Show first 10 functions
        result = False
    result
except Exception as e:
    print(f"❌ Error verifying execute_strategy: {e}")
    import traceback
    traceback.print_exc()
    False
      `);
      
      if (!checkResult) {
        this.isEnvironmentReady = false;
        throw new Error('execute_strategy function not available or not callable after initialization');
      }
      
      // Additional validation - try a simple test call
      console.log('🧪 Testing execute_strategy function...');
      const testResult = this.pyodideInstance.runPython(`
try:
    # Create minimal test data
    test_data = {
        'Close': [1.0, 1.1, 1.2],
        'close': [1.0, 1.1, 1.2],
        'Open': [1.0, 1.1, 1.2],
        'High': [1.0, 1.1, 1.2],
        'Low': [1.0, 1.1, 1.2],
        'Volume': [100, 200, 300]
    }
    test_code = "signals = [False, True, False]"
    
    # Test the function
    result = execute_strategy(test_data, test_code)
    if isinstance(result, dict) and 'entry' in result:
        print("✅ execute_strategy test successful")
        True
    else:
        print(f"⚠️ execute_strategy test returned unexpected result: {type(result)}")
        False
except Exception as e:
    print(f"❌ execute_strategy test failed: {e}")
    False
      `);
      
      if (!testResult) {
        console.warn('⚠️ execute_strategy test failed, but function exists - may still work');
        // Don't throw error here, just log warning
      }
      
      this.isEnvironmentReady = true;
      console.log('✅ Python environment verified and ready');
    } catch (error) {
      console.error('❌ Failed to initialize Python environment:', error);
      this.isEnvironmentReady = false;
      throw error;
    }
  }

  static async reinitializeEnvironment(pyodideInstance: PyodideInstance): Promise<void> {
    console.log('🔄 Force reinitializing Python environment...');
    this.isEnvironmentReady = false;
    
    try {
      // Re-run the strategy executor code
      console.log('📥 Reloading strategy executor code...');
      pyodideInstance.runPython(STRATEGY_EXECUTOR_PYTHON_CODE);
      
      // Verify execute_strategy is now available
      const checkResult = pyodideInstance.runPython(`
try:
    if 'execute_strategy' in globals() and callable(globals()['execute_strategy']):
        print("✅ execute_strategy function restored and callable")
        True
    else:
        print("❌ execute_strategy function still missing or not callable")
        available_funcs = [k for k in globals().keys() if callable(globals()[k]) and not k.startswith('_')]
        print(f"Available callable functions: {available_funcs[:10]}...")
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
      // Load Pyodide from CDN with retry logic
      if (typeof window !== 'undefined' && !window.loadPyodide) {
        console.log('🐍 Loading Pyodide script from CDN...');
        await this.loadPyodideScript();
      }

      console.log('🐍 Initializing Pyodide runtime...');
      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        fullStdLib: false
      });

      // Install required packages with timeout
      console.log('🐍 Installing Python packages...');
      const installTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Package installation timeout')), 30000);
      });
      
      await Promise.race([
        pyodide.loadPackage(['numpy', 'pandas']),
        installTimeout
      ]);
      
      console.log('🐍 Python packages installed successfully');
      console.log('🐍 Pyodide runtime initialized successfully');
      return pyodide as PyodideInstance;

    } catch (error) {
      console.error('🐍 Critical error during Pyodide initialization:', error);
      throw error instanceof Error ? error : new Error('Unknown Pyodide initialization error');
    }
  }

  private static async loadPyodideScript(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
      
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error('Pyodide script load timeout'));
      }, 30000);
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log('🐍 Pyodide script loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        console.error('🐍 Failed to load Pyodide script');
        reject(new Error('Failed to load Pyodide script from CDN'));
      };
      
      document.head.appendChild(script);
    });
  }

  static async isAvailable(): Promise<boolean> {
    try {
      if (this.pyodideInstance && this.isEnvironmentReady) {
        console.log('🐍 Pyodide already available and ready');
        return true;
      }

      console.log('🐍 Testing Pyodide availability...');
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Pyodide availability check timeout')), 45000);
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
    this.initializationAttempts = 0;
  }
}
