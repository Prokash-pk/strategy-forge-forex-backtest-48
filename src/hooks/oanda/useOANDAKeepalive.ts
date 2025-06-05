import { useEffect } from 'react';
import { OANDAConnectionKeepalive } from '@/services/oanda/connectionKeepalive';
import { OANDAConfig } from '@/types/oanda';

export const useOANDAKeepalive = (config: OANDAConfig, connectionStatus: string) => {
  const keepaliveService = OANDAConnectionKeepalive.getInstance();

  // Enhanced keepalive management - start keepalive when valid config is present
  useEffect(() => {
    const isConfigComplete = config.accountId?.trim() && config.apiKey?.trim();
    
    if (isConfigComplete) {
      console.log('🔄 Valid OANDA config detected, starting keepalive service...');
      keepaliveService.startKeepalive({
        accountId: config.accountId,
        apiKey: config.apiKey,
        environment: config.environment
      });
    } else {
      console.log('🛑 Stopping OANDA keepalive due to incomplete config');
      keepaliveService.stopKeepalive();
    }

    // Cleanup keepalive on unmount or config change
    return () => {
      if (!isConfigComplete) {
        keepaliveService.stopKeepalive();
      }
    };
  }, [config.accountId, config.apiKey, config.environment]);

  // Additional keepalive boost after successful connection test
  useEffect(() => {
    if (connectionStatus === 'success') {
      const isConfigComplete = config.accountId?.trim() && config.apiKey?.trim();
      if (isConfigComplete) {
        console.log('✅ Connection test successful, ensuring keepalive is active...');
        keepaliveService.startKeepalive({
          accountId: config.accountId,
          apiKey: config.apiKey,
          environment: config.environment
        });
      }
    }
  }, [connectionStatus, config.accountId, config.apiKey, config.environment]);

  return {
    keepaliveService,
    isKeepaliveActive: () => keepaliveService.isKeepaliveActive()
  };
};
