
import { LIGHTWEIGHT_PYTHON_SETUP } from './lightweightPythonSetup';

export class PythonEnvironmentInitializer {
  static async initializePyodide(): Promise<any> {
    console.log('🔧 Loading optimized Pyodide environment...');
    
    // Load Pyodide without heavy packages initially
    if (typeof window !== 'undefined' && !window.loadPyodide) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide'));
        document.head.appendChild(script);
      });
    }

    const pyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      fullStdLib: false
    });

    await PythonEnvironmentInitializer.loadEssentialPackages(pyodide);
    await PythonEnvironmentInitializer.setupLightweightEnvironment(pyodide);
    
    return pyodide;
  }

  private static async loadEssentialPackages(pyodide: any): Promise<void> {
    console.log('📦 Loading essential packages with retry logic...');
    let packagesLoaded = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!packagesLoaded && retryCount < maxRetries) {
      try {
        console.log(`📦 Package loading attempt ${retryCount + 1}/${maxRetries}...`);
        await pyodide.loadPackage(['numpy']);
        
        // Verify numpy is actually available
        await pyodide.runPython(`
import numpy as np
print("✅ Numpy successfully imported and verified")
test_array = np.array([1, 2, 3])
print(f"✅ Numpy test array: {test_array}")
`);
        
        packagesLoaded = true;
        console.log('✅ Essential packages loaded and verified');
        
      } catch (packageError) {
        retryCount++;
        console.warn(`⚠️ Package loading attempt ${retryCount} failed:`, packageError);
        
        if (retryCount >= maxRetries) {
          console.error('❌ Failed to load packages after all retries');
          throw new Error(`Failed to load Python packages after ${maxRetries} attempts: ${packageError.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  private static async setupLightweightEnvironment(pyodide: any): Promise<void> {
    console.log('⚠️ Skipping pandas to conserve memory - using lightweight alternatives');
    console.log('🔧 Setting up lightweight Python environment...');
    await pyodide.runPython(LIGHTWEIGHT_PYTHON_SETUP);
    console.log('✅ Optimized Python environment ready with verified packages');
  }
}
