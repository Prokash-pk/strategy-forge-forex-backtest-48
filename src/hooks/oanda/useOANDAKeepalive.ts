import { useEffect, useRef } from 'react';
import { OANDAConnectionKeepalive } from '@/services/oanda/connectionKeepalive';
import { OANDAConfig } from '@/types/oanda';

export const useOANDAKeepalive = (config: OANDAConfig, connectionStatus: string) => {
  const keepaliveService = OANDAConnectionKeepalive.getInstance();
  const lastConfigRef = useRef<string>('');
  const isStartedRef = useRef<boolean>(false);

  // Enhanced keepalive management - more persistent across navigation
  useEffect(() => {
    const isConfigComplete = config.accountId?.trim() && config.apiKey?.trim();
    const configKey = isConfigComplete ? `${config.accountId}-${config.environment}` : '';
    
    if (isConfigComplete) {
      // Only restart if config actually changed
      if (configKey !== lastConfigRef.current || !isStartedRef.current) {
        console.log('🔄 Starting/updating persistent OANDA keepalive service...');
        keepaliveService.startKeepalive({
          accountId: config.accountId,
          apiKey: config.apiKey,
          environment: config.environment
        });
        lastConfigRef.current = configKey;
        isStartedRef.current = true;
      } else {
        console.log('🔄 Keepalive already running with same config - no restart needed');
      }
    } else {
      console.log('🛑 Stopping OANDA keepalive due to incomplete config');
      keepaliveService.stopKeepalive();
      lastConfigRef.current = '';
      isStartedRef.current = false;
    }

    // IMPORTANT: Don't stop keepalive on component unmount - let it run persistently
    // This ensures connection stays alive during navigation
    return () => {
      // Only cleanup if config becomes invalid, not on navigation
      if (!isConfigComplete) {
        keepaliveService.stopKeepalive();
        isStartedRef.current = false;
      }
    };
  }, [config.accountId, config.apiKey, config.environment]);

  // Boost keepalive after successful connection test
  useEffect(() => {
    if (connectionStatus === 'success') {
      const isConfigComplete = config.accountId?.trim() && config.apiKey?.trim();
      if (isConfigComplete) {
        console.log('✅ Connection test successful, ensuring persistent keepalive is active...');
        keepaliveService.startKeepalive({
          accountId: config.accountId,
          apiKey: config.apiKey,
          environment: config.environment
        });
        isStartedRef.current = true;
      }
    }
  }, [connectionStatus, config.accountId, config.apiKey, config.environment]);

  // Monitor for potential disconnections and restart if needed
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const isConfigComplete = config.accountId?.trim() && config.apiKey?.trim();
      if (isConfigComplete && !keepaliveService.isKeepaliveActive() && isStartedRef.current) {
        console.log('🔄 Detected inactive keepalive, attempting restart...');
        keepaliveService.startKeepalive({
          accountId: config.accountId,
          apiKey: config.apiKey,
          environment: config.environment
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [config.accountId, config.apiKey, config.environment]);

  return {
    keepaliveService,
    isKeepaliveActive: () => keepaliveService.isKeepaliveActive(),
    getKeepaliveStatus: () => keepaliveService.getStatus(),
    forceRestart: () => keepaliveService.forceRestart()
  };
};
