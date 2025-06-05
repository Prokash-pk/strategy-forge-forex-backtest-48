import { useState, useEffect } from 'react';
import { ForwardTestingService } from '@/services/forwardTestingService';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { OANDAConfig, StrategySettings } from '@/types/oanda';

export const useOANDAForwardTesting = () => {
  const [isForwardTestingActive, setIsForwardTestingActive] = useState(false);

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

  const handleToggleForwardTesting = async (
    config: OANDAConfig,
    selectedStrategy: StrategySettings | null,
    canStartTesting: boolean
  ) => {
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

  return {
    isForwardTestingActive,
    setIsForwardTestingActive,
    handleToggleForwardTesting
  };
};
