import { useOANDAConfig } from '@/hooks/oanda/useOANDAConfig';
import { useOANDAConnection } from '@/hooks/oanda/useOANDAConnection';
import { useOANDAStrategies } from '@/hooks/oanda/useOANDAStrategies';
import { useOANDATrade } from '@/hooks/oanda/useOANDATrade';
import { useState, useEffect } from 'react';
import { ForwardTestingService } from '@/services/forwardTestingService';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const useOANDAIntegration = () => {
  const [isForwardTestingActive, setIsForwardTestingActive] = useState(false);

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

  // Check autonomous server-side trading status on mount and periodically
  useEffect(() => {
    const checkAutonomousTradingStatus = async () => {
      try {
        // Check server-side autonomous trading sessions - completely independent of client
        const activeSessions = await ServerForwardTestingService.getActiveSessions();
        const isAutonomousActive = activeSessions.length > 0;
        
        // Update UI state to reflect autonomous trading status
        setIsForwardTestingActive(isAutonomousActive);
        
        console.log('🤖 Autonomous trading status check:', {
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
      } catch (error) {
        console.error('Failed to check autonomous trading status:', error);
        setIsForwardTestingActive(false);
      }
    };

    checkAutonomousTradingStatus();
    
    // Check autonomous status every 30 seconds to stay in sync with server
    const interval = setInterval(checkAutonomousTradingStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Reset connection status when credentials change
  const handleConfigChangeWithReset = (field: keyof typeof config, value: any) => {
    handleConfigChange(field, value);
    if (field === 'accountId' || field === 'apiKey' || field === 'environment') {
      resetConnectionStatus();
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

  // Improve configuration checking logic
  const isConfigured = Boolean(config.accountId?.trim() && config.apiKey?.trim());
  
  // Allow test trades as long as we have valid credentials and a strategy
  const canStartTesting = isConfigured && selectedStrategy !== null;

  console.log('useOANDAIntegration state:', {
    isConfigured,
    connectionStatus,
    selectedStrategy: selectedStrategy?.strategy_name || 'None',
    selectedStrategyReturn: selectedStrategy?.total_return || 'N/A',
    canStartTesting,
    isTestingTrade,
    isForwardTestingActive
  });

  // Connection status icon
  const getConnectionStatusIcon = () => {
    if (connectionStatus === 'success') {
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
    connectionStatus,
    connectionError,
    savedStrategies,
    selectedStrategy,
    isLoading,
    isTestingTrade,
    isConfigured,
    canStartTesting,
    isForwardTestingActive,
    connectionStatusIcon,
    handleConfigChange: handleConfigChangeWithReset,
    handleTestConnection: () => handleTestConnection(config),
    handleSaveConfig,
    handleSaveNewConfig,
    handleLoadConfig,
    handleDeleteConfig,
    handleLoadStrategy,
    handleTestTrade: () => handleTestTrade(config, selectedStrategy, connectionStatus),
    handleDeleteStrategy,
    handleToggleForwardTesting,
    handleShowGuide,
    loadSelectedStrategy,
    loadSavedConfigs,
    loadSavedStrategies
  };
};
