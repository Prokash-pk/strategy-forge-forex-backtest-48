
import { useState, useEffect } from 'react';
import { OptimizedExecutionManager } from '@/services/python/optimizedExecutionManager';
import { LightweightSignalProcessor } from '@/services/trading/lightweightSignalProcessor';

export const usePythonStatus = () => {
  const [pythonStatus, setPythonStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkPythonStatus = async () => {
      try {
        console.log('🔍 Starting optimized Python status check...');
        setPythonStatus('checking');
        
        const executionManager = OptimizedExecutionManager.getInstance();
        await executionManager.initializePyodide();
        
        // Initialize lightweight processor for window binding
        console.log('🔧 Initializing lightweight signal processor...');
        LightweightSignalProcessor.getInstance();
        
        console.log('✅ Optimized Python environment available');
        setPythonStatus('available');
        setRetryCount(0);
      } catch (error) {
        console.error('❌ Optimized Python status check error:', error);
        setPythonStatus('unavailable');
        
        // Auto-retry only once to avoid memory overload
        if (retryCount < 1) {
          const delay = 3000; // 3 seconds
          console.log(`🔄 Retrying optimized Python check in ${delay}ms (attempt ${retryCount + 1})`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        }
      }
    };

    checkPythonStatus();
  }, [retryCount]);

  const forceRefresh = () => {
    console.log('🔄 Force refreshing optimized Python status...');
    OptimizedExecutionManager.getInstance().reset();
    setRetryCount(0);
    setPythonStatus('checking');
  };

  return { pythonStatus, forceRefresh };
};
