
import { useState, useEffect } from 'react';
import { MT4IntegrationService, MT4Signal } from '@/services/mt4IntegrationService';
import { useToast } from '@/hooks/use-toast';

export const useMT4Integration = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [lastSignalsSent, setLastSignalsSent] = useState<MT4Signal[]>([]);

  useEffect(() => {
    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(MT4IntegrationService.isConnectedToMT4());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const sendBacktestSignalsToMT4 = async (
    backtestResults: any, 
    symbol: string, 
    strategyName: string
  ): Promise<boolean> => {
    try {
      if (!isConnected) {
        toast({
          title: "MT4 Not Connected",
          description: "Please connect to MT4 first",
          variant: "destructive",
        });
        return false;
      }

      const signals = MT4IntegrationService.processBacktestResults(
        backtestResults, 
        symbol, 
        strategyName
      );

      if (signals.length === 0) {
        toast({
          title: "No Signals Generated",
          description: "The backtest didn't generate any trading signals",
          variant: "destructive",
        });
        return false;
      }

      // Send signals to MT4 with delay between each signal
      let successCount = 0;
      for (const signal of signals) {
        const success = await MT4IntegrationService.sendSignal(signal);
        if (success) {
          successCount++;
        }
        // Small delay between signals
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setLastSignalsSent(signals);

      toast({
        title: `Signals Sent to MT4! 📤`,
        description: `${successCount}/${signals.length} signals sent successfully`,
      });

      return successCount > 0;
    } catch (error) {
      console.error('Failed to send signals to MT4:', error);
      toast({
        title: "Failed to Send Signals",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const sendManualSignal = async (signal: MT4Signal): Promise<boolean> => {
    try {
      if (!isConnected) {
        toast({
          title: "MT4 Not Connected",
          description: "Please connect to MT4 first",
          variant: "destructive",
        });
        return false;
      }

      const success = await MT4IntegrationService.sendSignal(signal);
      
      if (success) {
        toast({
          title: "Signal Sent! 📤",
          description: `${signal.action} signal for ${signal.symbol} sent to MT4`,
        });
      } else {
        toast({
          title: "Signal Failed",
          description: "Failed to send signal to MT4",
          variant: "destructive",
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to send manual signal:', error);
      toast({
        title: "Signal Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    isConnected,
    lastSignalsSent,
    sendBacktestSignalsToMT4,
    sendManualSignal
  };
};
