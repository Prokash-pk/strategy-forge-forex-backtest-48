
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AutoStrategyTester } from '@/services/autoTesting/autoStrategyTester';

interface UseAutoTesterProps {
  strategy: any;
  oandaConfig: any;
  isConfigured: boolean;
}

export const useAutoTester = ({ strategy, oandaConfig, isConfigured }: UseAutoTesterProps) => {
  const { toast } = useToast();
  const [isTestingActive, setIsTestingActive] = useState(false);
  const [testInterval, setTestInterval] = useState(30);
  const [testCount, setTestCount] = useState(0);

  const autoTester = AutoStrategyTester.getInstance();

  useEffect(() => {
    const status = autoTester.getStatus();
    setIsTestingActive(status.isRunning);
  }, []);

  const handleStartTesting = async () => {
    if (!isConfigured || !strategy || !oandaConfig.accountId) {
      toast({
        title: "Configuration Required",
        description: "Please ensure strategy and OANDA configuration are complete",
        variant: "destructive",
      });
      return;
    }

    try {
      await autoTester.startAutoTesting(oandaConfig, strategy, testInterval);
      setIsTestingActive(true);
      setTestCount(0);
      
      toast({
        title: "🧪 Auto-Testing Started!",
        description: `Testing strategy every ${testInterval} seconds - check console for detailed logs`,
      });

      // Count tests
      const countInterval = setInterval(() => {
        if (autoTester.isActive()) {
          setTestCount(prev => prev + 1);
        } else {
          clearInterval(countInterval);
        }
      }, testInterval * 1000);

    } catch (error) {
      toast({
        title: "Failed to Start Testing",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleStopTesting = () => {
    autoTester.stopAutoTesting();
    setIsTestingActive(false);
    
    toast({
      title: "🛑 Auto-Testing Stopped",
      description: "Strategy testing has been stopped",
    });
  };

  const handleRunSingleTest = async () => {
    if (!isConfigured || !strategy || !oandaConfig.accountId) {
      toast({
        title: "Configuration Required", 
        description: "Please ensure strategy and OANDA configuration are complete",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the private method via a single test
      await autoTester.startAutoTesting(oandaConfig, strategy, 999999); // Very long interval
      setTimeout(() => {
        autoTester.stopAutoTesting();
      }, 1000); // Stop after 1 second
      
      toast({
        title: "🔍 Single Test Executed",
        description: "Check console for detailed strategy analysis",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return {
    isTestingActive,
    testInterval,
    testCount,
    setTestInterval,
    handleStartTesting,
    handleStopTesting,
    handleRunSingleTest
  };
};
