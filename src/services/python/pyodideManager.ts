
export class PyodideManager {
  private static instance: PyodideManager;
  private pyodide: any = null;
  private isLoading = false;

  static getInstance(): PyodideManager {
    if (!PyodideManager.instance) {
      PyodideManager.instance = new PyodideManager();
    }
    return PyodideManager.instance;
  }

  async getPyodide(): Promise<any> {
    if (this.pyodide) {
      return this.pyodide;
    }

    if (this.isLoading) {
      // Wait for existing load to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.pyodide;
    }

    this.isLoading = true;
    
    try {
      console.log('🔧 Loading Pyodide...');
      
      // Load Pyodide from CDN
      const pyodideScript = document.createElement('script');
      pyodideScript.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
      
      await new Promise((resolve, reject) => {
        pyodideScript.onload = resolve;
        pyodideScript.onerror = reject;
        document.head.appendChild(pyodideScript);
      });

      // Initialize Pyodide
      this.pyodide = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      });

      // Install required packages
      await this.pyodide.loadPackage(['numpy', 'pandas']);
      
      console.log('✅ Pyodide loaded successfully');
      this.isLoading = false;
      return this.pyodide;
      
    } catch (error) {
      console.error('❌ Failed to load Pyodide:', error);
      this.isLoading = false;
      throw error;
    }
  }

  reset(): void {
    this.pyodide = null;
    this.isLoading = false;
  }
}
