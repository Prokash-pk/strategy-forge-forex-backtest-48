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

  // Auto-start forward testing when strategy and OANDA are ready
  const autoStartForwardTesting = async (
    config: OANDAConfig,
    selectedStrategy: StrategySettings | null,
    oandaConnected: boolean
  ) => {
    // Only auto-start if not already active and conditions are met
    if (isForwardTestingActive || !oandaConnected || !selectedStrategy) {
      return;
    }

    // Check if user has previously enabled auto-start
    const autoStartEnabled = localStorage.getItem('autoStartForwardTesting') === 'true';
    if (!autoStartEnabled) {
      console.log('⏸️ Auto-start disabled by user preference');
      return;
    }

    console.log('🚀 Auto-starting forward testing - conditions met:', {
      oandaConnected,
      strategyReady: !!selectedStrategy,
      currentlyActive: isForwardTestingActive
    });

    try {
      const service = ForwardTestingService.getInstance();
      await service.startForwardTesting({
        strategyId: selectedStrategy.id,
        oandaAccountId: config.accountId,
        oandaApiKey: config.apiKey,
        environment: config.environment,
        enabled: true
      }, selectedStrategy);
      
      setIsForwardTestingActive(true);
      console.log('✅ AUTO-STARTED REAL TRADING - strategies will execute actual trades');
      console.log('💰 All signals from your strategy will be converted to live OANDA trades');
    } catch (error) {
      console.error('Failed to auto-start autonomous trading:', error);
    }
  };

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
      console.log('🛑 Real trading stopped - no more trades will be executed');
      
      // Disable auto-start when manually stopped
      localStorage.setItem('autoStartForwardTesting', 'false');
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
          console.log('🚀 REAL TRADING ACTIVATED - strategies will execute actual trades');
          console.log('💰 All strategy signals will now be converted to live OANDA trades');
          console.log('🤖 Trading operates autonomously - you can close browser safely');
          
          // Enable auto-start for future sessions
          localStorage.setItem('autoStartForwardTesting', 'true');
        } catch (error) {
          console.error('Failed to start real trading:', error);
          // Keep the state as false if starting failed
        }
      }
    }
  };

  return {
    isForwardTestingActive,
    setIsForwardTestingActive,
    handleToggleForwardTesting,
    autoStartForwardTesting
  };
};
