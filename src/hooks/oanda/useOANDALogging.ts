
import { useEffect } from 'react';
import { StrategySettings } from '@/types/oanda';
import { OANDAConnectionKeepalive } from '@/services/oanda/connectionKeepalive';

export const useOANDALogging = (
  savedStrategies: StrategySettings[],
  selectedStrategy: StrategySettings | null,
  config: any,
  connectionStatus: string,
  canStartTesting: boolean,
  isTestingTrade: boolean,
  isForwardTestingActive: boolean
) => {
  const keepaliveService = OANDAConnectionKeepalive.getInstance();

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

  // Log current state
  useEffect(() => {
    console.log('useOANDAIntegration state:', {
      isConfigured: Boolean(config.accountId?.trim() && config.apiKey?.trim()),
      connectionStatus,
      keepaliveActive: keepaliveService.isKeepaliveActive(),
      selectedStrategy: selectedStrategy?.strategy_name || 'None',
      selectedStrategyReturn: selectedStrategy?.total_return || 'N/A',
      canStartTesting,
      isTestingTrade,
      isForwardTestingActive
    });
  }, [config, connectionStatus, selectedStrategy, canStartTesting, isTestingTrade, isForwardTestingActive]);
};
