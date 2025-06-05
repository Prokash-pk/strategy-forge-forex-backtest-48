
import { useState, useEffect } from 'react';
import { PythonExecutor } from '@/services/pythonExecutor';

export const usePythonStatus = () => {
  const [pythonStatus, setPythonStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    const checkPythonStatus = async () => {
      try {
        const isAvailable = await PythonExecutor.isAvailable();
        setPythonStatus(isAvailable ? 'available' : 'unavailable');
      } catch {
        setPythonStatus('unavailable');
      }
    };

    checkPythonStatus();
  }, []);

  return pythonStatus;
};
