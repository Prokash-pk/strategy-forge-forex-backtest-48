
import { useOANDAConfig } from '@/hooks/oanda/useOANDAConfig';
import { useOANDAConnection } from '@/hooks/oanda/useOANDAConnection';
import { useOANDAStrategies } from '@/hooks/oanda/useOANDAStrategies';
import { useOANDATrade } from '@/hooks/oanda/useOANDATrade';
import { useState, useEffect, useRef } from 'react';
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

  // Load saved strategies on mount and log the process
  useEffect(() => {
    console.log('useOANDAIntegration: Loading strategies on mount');
    loadSavedStrategies();
    loadSelectedStrategy();
  }, []);

  // Load persistent OANDA connection status on mount - ONLY ONCE
  useEffect(() => {
    if (!user || hasLoadedPersistentConnection.current) return;

    const loadPersistentConnection = async () => {
      try {
        // Check if we have a saved, verified OANDA connection
        const { data: configs, error } = await supabase
          .from('oanda_configs')
          .select('*')
          .eq('user_id', user.id)
          .eq('enabled', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && configs && configs.length > 0) {
          const savedConfig = configs[0];
          console.log('🔗 Found persistent OANDA connection:', savedConfig.config_name);
          
          // Map database schema to SavedOANDAConfig interface
          const mappedConfig = {
            id: savedConfig.id,
            accountId: savedConfig.account_id,
            apiKey: savedConfig.api_key,
            environment: savedConfig.environment as 'practice' | 'live',
            enabled: savedConfig.enabled,
            configName: savedConfig.config_name,
            createdAt: savedConfig.created_at
          };
          
          // Load the config into current state
          handleLoadConfig(mappedConfig);
          setPersistentConnectionStatus('connected');
          
          console.log('✅ OANDA credentials restored from persistent storage');
          console.log('🚀 Ready for autonomous trading');
        } else {
          console.log('❌ No persistent OANDA connection found');
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

  // Enhanced config save that marks connection as persistent
  const handlePersistentSaveConfig = async () => {
    try {
      // First test the connection to ensure it's valid
      await handleTestConnection(config);
      
      if (connectionStatus === 'success') {
        // Save config with enabled flag set to true for persistence
        const configToSave = {
          ...config,
          enabled: true,
          configName: config.configName || `OANDA Config ${new Date().toLocaleDateString()}`
        };

        await handleSaveNewConfig(configToSave);
        setPersistentConnectionStatus('connected');

        console.log('🔐 OANDA connection saved persistently');
        console.log('✅ Will remain connected across browser sessions');
        console.log('🤖 Ready for 24/7 autonomous trading');
      } else {
        throw new Error('Connection test failed - cannot save invalid credentials');
      }
    } catch (error) {
      console.error('Failed to save persistent OANDA connection:', error);
      setPersistentConnectionStatus('error');
    }
  };

  // Enhanced logout that clears persistent connection
  const handleDisconnectOANDA = async () => {
    try {
      if (!user) return;

      // Disable all OANDA configs for this user
      const { error } = await supabase
        .from('oanda_configs')
        .update({ enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      // Reset local state
      resetConnectionStatus();
      setPersistentConnectionStatus('idle');
      hasLoadedPersistentConnection.current = false;
      
      console.log('🔌 OANDA connection disconnected');
      console.log('❌ Persistent credentials cleared');
    } catch (error) {
      console.error('Failed to disconnect OANDA:', error);
    }
  };

  // Debug log when strategies or selected strategy changes
  useEffect(() => {
    console.log('Strategies updated:', {
      totalStrategies: savedStrategies.length,
      selectedStrategy: selectedStrategy?.strategy_name || 'None',
      strategies: savedStrategies.map(s => s.strategy_name)
    });
    
    // Look for Smart Momentum Strategy with high return
    const smartMomentumStrategies = savedStrategies.filter(s => 
      s.strategy_name?.toLowerCase().includes('smart momentum')
    );
    
    console.log('Smart Momentum Strategies found:', smartMomentumStrategies.map(s => ({
      name: s.strategy_name,
      return: s.total_return,
      winRate: s.win_rate,
      id: s.id
    })));
    
    // Find the one with ~62% return
    const highReturnStrategy = smartMomentumStrategies.find(s => 
      s.total_return && s.total_return > 60 && s.total_return < 65
    );
    
    if (highReturnStrategy) {
      console.log('Found Smart Momentum Strategy with 62% return:', {
        name: highReturnStrategy.strategy_name,
        return: highReturnStrategy.total_return,
        winRate: highReturnStrategy.win_rate,
        id: highReturnStrategy.id
      });
    }
  }, [savedStrategies, selectedStrategy]);

  // Check autonomous server-side trading status on mount and periodically - but less frequently
  useEffect(() => {
    const checkAutonomousTradingStatus = async () => {
      try {
        // Check server-side autonomous trading sessions - completely independent of client
        const activeSessions = await ServerForwardTestingService.getActiveSessions();
        const isAutonomousActive = activeSessions.length > 0;
        
        // Only update state if it actually changed to prevent unnecessary re-renders
        setIsForwardTestingActive(prev => {
          if (prev !== isAutonomousActive) {
            console.log('🤖 Autonomous trading status changed:', {
              autonomousActive: isAutonomousActive,
              totalActiveSessions: activeSessions.length,
              status: isAutonomousActive ? 'RUNNING AUTONOMOUSLY' : 'INACTIVE'
            });

            if (isAutonomousActive) {
              console.log('✅ AUTONOMOUS TRADING IS ACTIVE');
              console.log('🚀 Trading operations running independently on server 24/7');
              console.log('💻 No client connection required - fully autonomous');
            } else {
              console.log('⏸️ No autonomous trading sessions detected');
            }
            
            return isAutonomousActive;
          }
          return prev;
        });
      } catch (error) {
        console.error('Failed to check autonomous trading status:', error);
        setIsForwardTestingActive(false);
      }
    };

    checkAutonomousTradingStatus();
    
    // Check autonomous status every 60 seconds instead of 30 to reduce noise
    const interval = setInterval(checkAutonomousTradingStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Reset connection status when credentials change (but preserve persistent status)
  const handleConfigChangeWithReset = (field: keyof typeof config, value: any) => {
    handleConfigChange(field, value);
    if (field === 'accountId' || field === 'apiKey' || field === 'environment') {
      resetConnectionStatus();
      // Don't reset persistent status - let user save new config to update it
    }
  };

  const handleToggleForwardTesting = async () => {
    const service = ForwardTestingService.getInstance();
    
    if (isForwardTestingActive) {
      // Stop autonomous trading
      await service.stopForwardTesting();
      setIsForwardTestingActive(false);
      console.log('🛑 Autonomous trading stopped');
    } else {
      // Start autonomous trading
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
          console.log('🚀 AUTONOMOUS TRADING ACTIVATED - operates 24/7 independently');
          console.log('💻 You can now close your browser/computer safely');
        } catch (error) {
          console.error('Failed to start autonomous trading:', error);
          // Keep the state as false if starting failed
        }
      }
    }
  };

  const handleShowGuide = () => {
    console.log('Show OANDA setup guide');
  };

  // Improve configuration checking logic - use persistent status when available
  const isConfigured = persistentConnectionStatus === 'connected' || 
                      Boolean(config.accountId?.trim() && config.apiKey?.trim());
  
  // Allow test trades as long as we have valid credentials and a strategy
  const canStartTesting = isConfigured && selectedStrategy !== null;

  console.log('useOANDAIntegration state:', {
    isConfigured,
    connectionStatus,
    persistentConnectionStatus,
    selectedStrategy: selectedStrategy?.strategy_name || 'None',
    selectedStrategyReturn: selectedStrategy?.total_return || 'N/A',
    canStartTesting,
    isTestingTrade,
    isForwardTestingActive
  });

  // Connection status icon - prioritize persistent status with stable logic
  const getConnectionStatusIcon = () => {
    if (persistentConnectionStatus === 'connected' || connectionStatus === 'success') {
      return CheckCircle;
    } else if (connectionStatus === 'testing') {
      return Clock;
    } else {
      return XCircle;
    }
  };

  const connectionStatusIcon = getConnectionStatusIcon();

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
