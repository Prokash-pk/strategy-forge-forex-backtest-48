
import { STRATEGY_EXECUTOR_PYTHON_CODE } from './strategyExecutor';
import type { PyodideInstance } from './types';

export class PyodideLoader {
  private static pyodideInstance: PyodideInstance | null = null;
  private static isLoading = false;
  private static loadPromise: Promise<PyodideInstance> | null = null;

  static async initialize(): Promise<PyodideInstance> {
    if (this.pyodideInstance) {
      return this.pyodideInstance;
    }

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this.loadPyodideInternal();
    
    try {
      this.pyodideInstance = await this.loadPromise;
      return this.pyodideInstance;
    } finally {
      this.isLoading = false;
    }
  }

  private static async loadPyodideInternal(): Promise<PyodideInstance> {
    // Load Pyodide from CDN
    if (typeof window !== 'undefined' && !window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide'));
        document.head.appendChild(script);
      });
    }

    console.log('Loading Pyodide...');
    const pyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
    });

    // Install required packages
    console.log('Installing Python packages...');
    await pyodide.loadPackage(['numpy', 'pandas']);

    // Set up the Python environment with helper functions
    pyodide.runPython(STRATEGY_EXECUTOR_PYTHON_CODE);

    console.log('Pyodide initialized successfully');
    return pyodide as PyodideInstance;
  }

  static async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return true;
    } catch {
      return false;
    }
  }
}
