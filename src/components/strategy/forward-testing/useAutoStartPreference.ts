
import { useState, useCallback } from 'react';

export const useAutoStartPreference = () => {
  const [autoStartEnabled, setAutoStartEnabled] = useState(
    localStorage.getItem('autoStartForwardTesting') === 'true'
  );

  const toggleAutoStart = useCallback(() => {
    const newValue = !autoStartEnabled;
    localStorage.setItem('autoStartForwardTesting', String(newValue));
    setAutoStartEnabled(newValue);
    window.location.reload(); // Simple way to update state
  }, [autoStartEnabled]);

  return {
    autoStartEnabled,
    toggleAutoStart
  };
};
