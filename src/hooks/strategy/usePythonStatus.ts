
import { useState, useEffect } from 'react';
import { PythonExecutor } from '@/services/pythonExecutor';

export const usePythonStatus = () => {
  const [pythonStatus, setPythonStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkPythonStatus = async () => {
      try {
        console.log('🔍 Starting Python status check...');
        setPythonStatus('checking');
        
        const isAvailable = await PythonExecutor.isAvailable();
        
        if (isAvailable) {
          console.log('✅ Python environment available');
          setPythonStatus('available');
          setRetryCount(0);
        } else {
          console.warn('⚠️ Python environment unavailable');
          setPythonStatus('unavailable');
          
          // Auto-retry up to 2 times with increasing delays
          if (retryCount < 2) {
            const delay = (retryCount + 1) * 5000; // 5s, 10s
            console.log(`🔄 Retrying Python check in ${delay}ms (attempt ${retryCount + 1})`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, delay);
          }
        }
      } catch (error) {
        console.error('❌ Python status check error:', error);
        setPythonStatus('unavailable');
      }
    };

    checkPythonStatus();
  }, [retryCount]);

  const forceRefresh = () => {
    console.log('🔄 Force refreshing Python status...');
    PythonExecutor.resetPythonEnvironment();
    setRetryCount(0);
    setPythonStatus('checking');
  };

  return { pythonStatus, forceRefresh };
};
