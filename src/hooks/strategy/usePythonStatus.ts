
import { useState, useEffect } from 'react';
import { PythonExecutor } from '@/services/pythonExecutor';

export const usePythonStatus = () => {
  const [pythonStatus, setPythonStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const checkPythonStatus = async () => {
      try {
        console.log('🔍 Starting Python status check...');
        setPythonStatus('checking');
        setLastError(null);
        
        const isAvailable = await PythonExecutor.isAvailable();
        
        if (isAvailable) {
          console.log('✅ Python environment available');
          setPythonStatus('available');
          setRetryCount(0);
          setLastError(null);
        } else {
          console.warn('⚠️ Python environment unavailable');
          setPythonStatus('unavailable');
          
          // Get the last error for display
          const error = PythonExecutor.getLastError?.();
          if (error) {
            setLastError(error.message);
          }
          
          // Auto-retry up to 2 times with increasing delays
          if (retryCount < 2) {
            const delay = (retryCount + 1) * 5000; // 5s, 10s
            console.log(`🔄 Retrying Python check in ${delay}ms (attempt ${retryCount + 1})`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, delay);
          } else {
            console.error('❌ Python environment failed after all retry attempts');
          }
        }
      } catch (error) {
        console.error('❌ Python status check error:', error);
        setPythonStatus('unavailable');
        setLastError(error instanceof Error ? error.message : 'Unknown error');
        
        // Auto-retry up to 2 times with increasing delays
        if (retryCount < 2) {
          const delay = (retryCount + 1) * 5000; // 5s, 10s
          console.log(`🔄 Retrying Python check in ${delay}ms after error (attempt ${retryCount + 1})`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        }
      }
    };

    checkPythonStatus();
  }, [retryCount]);

  const forceRefresh = () => {
    console.log('🔄 Force refreshing Python status...');
    PythonExecutor.resetPythonEnvironment();
    setRetryCount(0);
    setLastError(null);
    setPythonStatus('checking');
  };

  return { 
    pythonStatus, 
    forceRefresh, 
    retryCount, 
    lastError,
    maxRetries: 2 
  };
};
