
import { useOANDAConfig } from '@/hooks/oanda/useOANDAConfig';
import { useOANDAConnection } from '@/hooks/oanda/useOANDAConnection';
import { useOANDAStrategies } from '@/hooks/oanda/useOANDAStrategies';
import { useOANDATrade } from '@/hooks/oanda/useOANDATrade';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ForwardTestingService } from '@/services/forwardTestingService';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useOANDAIntegration = () => {
  const [isForwardTestingActive, setIsForwardTestingActive] = useState(false);
  const [persistentConnectionStatus, setPersistentConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const { user } = useAuth();
  const hasLoadedPersistentConnection = useRef(false);
  const lastStatusCheck = useRef(0);
  const statusCheckInterval = useRef<NodeJS.Timeout>();

  const {
    config,
    savedConfigs,
    isLoading,
    handleConfigChange,
    handleSaveConfig,
    handleSaveNewConfig,
    handleLoadConfig,
    handleDeleteConfig,
    loadSavedConfigs
  } = useOANDAConfig();

  const {
    connectionStatus,
    connectionError,
    handleTestConnection,
    resetConnectionStatus
  } = useOANDAConnection();

  const {
    savedStrategies,
    selectedStrategy,
    loadSelectedStrategy,
    loadSavedStrategies,
    handleLoadStrategy,
    handleDeleteStrategy
  } = useOANDAStrategies();

  const {
    isTestingTrade,
    handleTestTrade
  } = useOANDATrade();

  // Debounced status check to prevent excessive API calls
  const checkAutonomousStatus = useCallback(async () => {
    const now = Date.now();
    if (now - lastStatusCheck.current < 30000) return; // Minimum 30 seconds between checks
    
    lastStatusCheck.current = now;
    
    try {
      const activeSessions = await ServerForwardTestingService.getActiveSessions();
      const isAutonomousActive = activeSessions.length > 0;
      
      setIsForwardTestingActive(prev => {
        if (prev !== isAutonomousActive) {
          console.log('🤖 Autonomous trading status:', isAutonomousActive ? 'ACTIVE' : 'INACTIVE');
        }
        return isAutonomousActive;
      });
    } catch (error) {
      console.error('Failed to check autonomous trading status:', error);
      setIsForwardTestingActive(false);
    }
  }, []);

  // Load strategies only once on mount
  useEffect(() => {
    if (!user) return;
    
    console.log('Loading OANDA strategies...');
    loadSavedStrategies();
    loadSelectedStrategy();
  }, [user]);

  // Load persistent connection only once per user session
  useEffect(() => {
    if (!user || hasLoadedPersistentConnection.current) return;

    const loadPersistentConnection = async () => {
      try {
        const { data: configs, error } = await supabase
          .from('oanda_configs')
          .select('*')
          .eq('user_id', user.id)
          .eq('enabled', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && configs && configs.length > 0) {
          const savedConfig = configs[0];
          
          const mappedConfig = {
            id: savedConfig.id,
            accountId: savedConfig.account_id,
            apiKey: savedConfig.api_key,
            environment: savedConfig.environment as 'practice' | 'live',
            enabled: savedConfig.enabled,
            configName: savedConfig.config_name,
            createdAt: savedConfig.created_at
          };
          
          handleLoadConfig(mappedConfig);
          setPersistentConnectionStatus('connected');
          console.log('✅ OANDA credentials restored from persistent storage');
        } else {
          setPersistentConnectionStatus('idle');
        }
        
        hasLoadedPersistentConnection.current = true;
      } catch (error) {
        console.error('Failed to load persistent OANDA connection:', error);
        setPersistentConnectionStatus('error');
        hasLoadedPersistentConnection.current = true;
      }
    };

    loadPersistentConnection();
  }, [user, handleLoadConfig]);

  // Check autonomous status periodically but less frequently
  useEffect(() => {
    if (!user) return;

    // Initial check
    checkAutonomousStatus();
    
    // Set up interval for periodic checks (every 2 minutes instead of 1 minute)
    statusCheckInterval.current = setInterval(checkAutonomousStatus, 120000);
    
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, [user, checkAutonomousStatus]);

  // Memoized config save handler
  const handlePersistentSaveConfig = useCallback(async () => {
    try {
      await handleTestConnection(config);
      
      if (connectionStatus === 'success') {
        const configToSave = {
          ...config,
          enabled: true,
          configName: config.configName || `OANDA Config ${new Date().toLocaleDateString()}`
        };

        await handleSaveNewConfig(configToSave);
        setPersistentConnectionStatus('connected');
        console.log('🔐 OANDA connection saved persistently');
      } else {
        throw new Error('Connection test failed - cannot save invalid credentials');
      }
    } catch (error) {
      console.error('Failed to save persistent OANDA connection:', error);
      setPersistentConnectionStatus('error');
    }
  }, [config, connectionStatus, handleTestConnection, handleSaveNewConfig]);

  // Memoized disconnect handler
  const handleDisconnectOANDA = useCallback(async () => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('oanda_configs')
        .update({ enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      resetConnectionStatus();
      setPersistentConnectionStatus('idle');
      hasLoadedPersistentConnection.current = false;
      
      console.log('🔌 OANDA connection disconnected');
    } catch (error) {
      console.error('Failed to disconnect OANDA:', error);
    }
  }, [user, resetConnectionStatus]);

  // Memoized config change handler
  const handleConfigChangeWithReset = useCallback((field: keyof typeof config, value: any) => {
    handleConfigChange(field, value);
    if (field === 'accountId' || field === 'apiKey' || field === 'environment') {
      resetConnectionStatus();
    }
  }, [handleConfigChange, resetConnectionStatus]);

  // Memoized forward testing toggle
  const handleToggleForwardTesting = useCallback(async () => {
    const service = ForwardTestingService.getInstance();
    
    if (isForwardTestingActive) {
      await service.stopForwardTesting();
      setIsForwardTestingActive(false);
      console.log('🛑 Autonomous trading stopped');
    } else {
      if (canStartTesting && selectedStrategy) {
        try {
          await service.startForwardTesting({
            strategyId: selectedStrategy.id,
            oandaAccountId: config.accountId,
            oandaApiKey: config.apiKey,
            environment: config.environment,
            enabled: true
          }, selectedStrategy);
          
          setIsForwardTestingActive(true);
          console.log('🚀 AUTONOMOUS TRADING ACTIVATED');
        } catch (error) {
          console.error('Failed to start autonomous trading:', error);
        }
      }
    }
  }, [isForwardTestingActive, canStartTesting, selectedStrategy, config]);

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

  const handleShowGuide = useCallback(() => {
    console.log('Show OANDA setup guide');
  }, []);

  return {
    config,
    savedConfigs,
    connectionStatus: persistentConnectionStatus === 'connected' ? 'success' : connectionStatus,
    connectionError,
    savedStrategies,
    selectedStrategy,
    isLoading,
    isTestingTrade,
    isConfigured,
    canStartTesting,
    isForwardTestingActive,
    connectionStatusIcon,
    persistentConnectionStatus,
    handleConfigChange: handleConfigChangeWithReset,
    handleTestConnection: () => handleTestConnection(config),
    handleSaveConfig: handlePersistentSaveConfig,
    handleSaveNewConfig,
    handleLoadConfig,
    handleDeleteConfig,
    handleLoadStrategy,
    handleTestTrade: () => handleTestTrade(config, selectedStrategy, connectionStatus),
    handleDeleteStrategy,
    handleToggleForwardTesting,
    handleShowGuide,
    handleDisconnectOANDA,
    loadSelectedStrategy,
    loadSavedConfigs,
    loadSavedStrategies
  };
};
