import { useState, useEffect } from 'react';
import { ForwardTestingService } from '@/services/forwardTestingService';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { OANDAConfig, StrategySettings } from '@/types/oanda';

export const useOANDAForwardTesting = () => {
  const [isForwardTestingActive, setIsForwardTestingActive] = useState(false);

  // Check status more frequently and restore active sessions
  useEffect(() => {
    const checkForwardTestingStatus = async () => {
      try {
        const service = ForwardTestingService.getInstance();
        const activeSessions = await service.getActiveSessions();
        
        // Check if any sessions are active
        const hasActiveSessions = activeSessions.length > 0 && activeSessions.some(session => session.enabled);
        
        setIsForwardTestingActive(hasActiveSessions);
        
        console.log('🔍 Forward testing status check:', {
          activeSessions: activeSessions.length,
          isActive: hasActiveSessions,
          sessions: activeSessions.map(s => ({ id: s.id, enabled: s.enabled }))
        });

        if (hasActiveSessions) {
          console.log('✅ FORWARD TESTING IS ACTIVE');
          console.log('🚀 Trading operations running - monitoring for signals');
        } else {
          console.log('⏸️ No active forward testing sessions detected');
        }
      } catch (error) {
        console.error('Failed to check forward testing status:', error);
        setIsForwardTestingActive(false);
      }
    };

    // Initial check
    checkForwardTestingStatus();
    
    // Check status every 10 seconds to stay in sync
    const interval = setInterval(checkForwardTestingStatus, 10000);
    
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
        accountId: config.accountId,
        apiKey: config.apiKey,
        environment: config.environment,
        enabled: true
      }, selectedStrategy);
      
      setIsForwardTestingActive(true);
      console.log('✅ AUTO-STARTED REAL TRADING - strategies will execute actual trades');
      console.log('💰 All signals from your strategy will be converted to live OANDA trades');
    } catch (error) {
      console.error('Failed to auto-start forward testing:', error);
    }
  };

  const handleToggleForwardTesting = async (
    config: OANDAConfig,
    selectedStrategy: StrategySettings | null,
    canStartTesting: boolean
  ) => {
    const service = ForwardTestingService.getInstance();
    
    if (isForwardTestingActive) {
      // Stop forward testing
      await service.stopForwardTesting();
      setIsForwardTestingActive(false);
      console.log('🛑 Real trading stopped - no more trades will be executed');
      
      // Disable auto-start when manually stopped
      localStorage.setItem('autoStartForwardTesting', 'false');
    } else {
      // Start forward testing
      if (canStartTesting && selectedStrategy) {
        try {
          await service.startForwardTesting({
            strategyId: selectedStrategy.id,
            accountId: config.accountId,
            apiKey: config.apiKey,
            environment: config.environment,
            enabled: true
          }, selectedStrategy);
          
          setIsForwardTestingActive(true);
          console.log('🚀 REAL TRADING ACTIVATED - strategies will execute actual trades');
          console.log('💰 All strategy signals will now be converted to live OANDA trades');
          console.log('🤖 Trading operates autonomously - signals monitored every minute');
          
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
