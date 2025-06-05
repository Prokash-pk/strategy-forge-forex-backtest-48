
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
    setIsMonitoring(monitor.isActive());
  }, []);

  const startMonitoring = async (config: OANDAConfig, strategy: StrategySettings) => {
    try {
      await monitor.startMonitoring(config, strategy, (result: PriceMonitorResult) => {
        setLatestResult(result);
        
        // Add to signal history if it's a signal
        if (result.signalGenerated) {
          setSignalHistory(prev => [...prev.slice(-19), result]); // Keep last 20 signals
          
          // Show toast notification for signals
          toast({
            title: `🚨 ${result.signalType} Signal Detected!`,
            description: `${result.symbol} at ${result.currentPrice} (${(result.confidence * 100).toFixed(1)}% confidence)`,
          });
        }
      });
      
      setIsMonitoring(true);
      
      toast({
        title: "Price Monitor Started ✅",
        description: `Monitoring ${strategy.symbol} every minute for signals`,
      });
      
    } catch (error) {
      console.error('Failed to start price monitoring:', error);
      toast({
        title: "Monitor Start Failed ❌",
        description: "Could not start price monitoring",
        variant: "destructive",
      });
    }
  };

  const stopMonitoring = () => {
    monitor.stopMonitoring();
    setIsMonitoring(false);
    
    toast({
      title: "Price Monitor Stopped 🛑",
      description: "Real-time signal monitoring has been stopped",
    });
  };

  const clearHistory = () => {
    setSignalHistory([]);
    setLatestResult(null);
  };

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
