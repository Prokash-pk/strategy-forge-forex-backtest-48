
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ForwardTestingService } from '@/services/forwardTestingService';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';

export const useOANDAForwardTesting = () => {
  const [isForwardTestingActive, setIsForwardTestingActive] = useState(false);
  const { user } = useAuth();
  const lastStatusCheck = useRef(0);
  const statusCheckInterval = useRef<NodeJS.Timeout>();

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

  // Check autonomous status periodically but less frequently
  useEffect(() => {
    if (!user) return;

    // Initial check
    checkAutonomousStatus();
    
    // Set up interval for periodic checks (every 2 minutes)
    statusCheckInterval.current = setInterval(checkAutonomousStatus, 120000);
    
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, [user, checkAutonomousStatus]);

  const handleToggleForwardTesting = useCallback(async (canStartTesting: boolean, selectedStrategy: any, config: any) => {
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
  }, [isForwardTestingActive]);

  return {
    isForwardTestingActive,
    handleToggleForwardTesting
  };
};
