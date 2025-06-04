
import { useMemo } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const useOANDAComputedValues = (
  persistentConnectionStatus: string,
  connectionStatus: string,
  config: any,
  selectedStrategy: any
) => {
  // Memoized computed values to prevent unnecessary re-renders
  const isConfigured = useMemo(() => 
    persistentConnectionStatus === 'connected' || 
    Boolean(config.accountId?.trim() && config.apiKey?.trim())
  , [persistentConnectionStatus, config.accountId, config.apiKey]);
  
  const canStartTesting = useMemo(() => 
    isConfigured && selectedStrategy !== null
  , [isConfigured, selectedStrategy]);

  const connectionStatusIcon = useMemo(() => {
    if (persistentConnectionStatus === 'connected' || connectionStatus === 'success') {
      return CheckCircle;
    } else if (connectionStatus === 'testing') {
      return Clock;
    } else {
      return XCircle;
    }
  }, [persistentConnectionStatus, connectionStatus]);

  return {
    isConfigured,
    canStartTesting,
    connectionStatusIcon
  };
};
