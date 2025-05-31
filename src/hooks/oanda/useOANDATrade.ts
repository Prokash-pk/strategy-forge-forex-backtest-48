
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OANDAConfig, StrategySettings } from '@/types/oanda';

export const useOANDATrade = () => {
  const { toast } = useToast();
  const [isTestingTrade, setIsTestingTrade] = useState(false);

  const handleTestTrade = async (config: OANDAConfig, selectedStrategy: StrategySettings | null, connectionStatus: string) => {
    if (!config.accountId || !config.apiKey) {
      toast({
        title: "Configuration Required",
        description: "Please configure your OANDA API credentials first",
        variant: "destructive",
      });
      return;
    }

    if (connectionStatus !== 'success') {
      toast({
        title: "Test Connection First",
        description: "Please test your OANDA connection before executing a test trade",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStrategy) {
      toast({
        title: "Strategy Required",
        description: "Please select a strategy with saved settings to use for the test trade",
        variant: "destructive",
      });
      return;
    }

    setIsTestingTrade(true);

    try {
      const testSignal = {
        action: 'BUY' as const,
        symbol: selectedStrategy.symbol.replace('=X', '').replace('/', '_'),
        units: 100,
        stopLoss: undefined,
        takeProfit: undefined,
        strategyId: selectedStrategy.id,
        userId: 'test-user'
      };

      const oandaConfig = {
        accountId: config.accountId,
        apiKey: config.apiKey,
        environment: config.environment
      };

      console.log('Executing test trade:', testSignal);
      
      const response = await supabase.functions.invoke('oanda-trade-executor', {
        body: {
          signal: testSignal,
          config: oandaConfig
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Trade execution failed');
      }

      if (response.data?.success) {
        toast({
          title: "Test Trade Successful! ✅",
          description: `Test ${testSignal.action} order for ${testSignal.units} units of ${testSignal.symbol} executed successfully`,
        });
        
        console.log('Test trade result:', response.data.result);
      } else {
        throw new Error(response.data?.error || 'Trade execution failed');
      }

    } catch (error) {
      console.error('Test trade error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Test Trade Failed ❌",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTestingTrade(false);
    }
  };

  return {
    isTestingTrade,
    handleTestTrade
  };
};
