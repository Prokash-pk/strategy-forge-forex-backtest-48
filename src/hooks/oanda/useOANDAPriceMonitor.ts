
import { useState, useEffect } from 'react';
import { OANDAPriceMonitor, PriceMonitorResult } from '@/services/oanda/priceMonitor';
import { OANDAConfig, StrategySettings } from '@/types/oanda';
import { useToast } from '@/hooks/use-toast';

export const useOANDAPriceMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [latestResult, setLatestResult] = useState<PriceMonitorResult | null>(null);
  const [signalHistory, setSignalHistory] = useState<PriceMonitorResult[]>([]);
  const { toast } = useToast();

  const monitor = OANDAPriceMonitor.getInstance();

  useEffect(() => {
    // Check if monitoring is already active on mount
    const activeStatus = monitor.isActive();
    setIsMonitoring(activeStatus);
    console.log('🔍 useOANDAPriceMonitor initialized:', {
      isMonitoringActive: activeStatus,
      monitorStatus: monitor.getStatus()
    });
  }, []);

  const startMonitoring = async (config: OANDAConfig, strategy: StrategySettings) => {
    console.log('🚀 startMonitoring called:', {
      config: {
        accountId: config.accountId ? 'SET' : 'NOT_SET',
        apiKey: config.apiKey ? 'SET' : 'NOT_SET',
        environment: config.environment
      },
      strategy: {
        name: strategy.name,
        symbol: strategy.symbol
      }
    });

    try {
      await monitor.startMonitoring(config, strategy, (result: PriceMonitorResult) => {
        console.log('📊 Monitor Result Received:', {
          timestamp: result.timestamp,
          symbol: result.symbol,
          price: result.currentPrice,
          hasSignal: result.signalGenerated,
          signalType: result.signalType,
          confidence: result.confidence
        });

        setLatestResult(result);
        
        // Add to signal history if it's a signal
        if (result.signalGenerated) {
          console.log('🚨 SIGNAL DETECTED!', {
            type: result.signalType,
            symbol: result.symbol,
            price: result.currentPrice,
            confidence: (result.confidence * 100).toFixed(1) + '%'
          });

          setSignalHistory(prev => [...prev.slice(-19), result]); // Keep last 20 signals
          
          // Show toast notification for signals
          toast({
            title: `🚨 ${result.signalType} Signal Detected!`,
            description: `${result.symbol} at ${result.currentPrice} (${(result.confidence * 100).toFixed(1)}% confidence)`,
          });
        }
      });
      
      setIsMonitoring(true);
      console.log('✅ Monitoring started successfully');
      
      toast({
        title: "Price Monitor Started ✅",
        description: `Monitoring ${strategy.symbol} every minute for signals`,
      });
      
    } catch (error) {
      console.error('❌ Failed to start price monitoring:', error);
      toast({
        title: "Monitor Start Failed ❌",
        description: "Could not start price monitoring",
        variant: "destructive",
      });
    }
  };

  const stopMonitoring = () => {
    console.log('🛑 stopMonitoring called');
    monitor.stopMonitoring();
    setIsMonitoring(false);
    
    toast({
      title: "Price Monitor Stopped 🛑",
      description: "Real-time signal monitoring has been stopped",
    });
  };

  const clearHistory = () => {
    console.log('🧹 Clearing signal history');
    setSignalHistory([]);
    setLatestResult(null);
  };

  // Log state changes
  useEffect(() => {
    console.log('📊 Monitor State Updated:', {
      isMonitoring,
      latestResultTime: latestResult?.timestamp,
      signalHistoryCount: signalHistory.length,
      monitorStatus: monitor.getStatus()
    });
  }, [isMonitoring, latestResult, signalHistory]);

  return {
    isMonitoring,
    latestResult,
    signalHistory,
    startMonitoring,
    stopMonitoring,
    clearHistory,
    monitorStatus: monitor.getStatus()
  };
};
