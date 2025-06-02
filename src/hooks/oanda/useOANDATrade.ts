
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

    setIsTestingTrade(true);

    try {
      // Get current market price first to set appropriate stop loss and take profit
      const symbol = selectedStrategy?.symbol?.replace('=X', '').replace('/', '_') || 'EUR_USD';
      
      // Get current pricing information
      const baseUrl = config.environment === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      console.log('Fetching current price for', symbol);
      
      const priceResponse = await fetch(`${baseUrl}/v3/accounts/${config.accountId}/pricing?instruments=${symbol}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      let currentPrice = null;
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        if (priceData.prices && priceData.prices.length > 0) {
          const pricing = priceData.prices[0];
          currentPrice = parseFloat(pricing.bids[0].price);
          console.log('Current price for', symbol, ':', currentPrice);
        }
      }

      // Create a realistic test trade signal
      const testSignal = {
        action: 'BUY' as const,
        symbol: symbol,
        units: 100, // Small test size
        stopLoss: currentPrice ? (currentPrice - 0.0020).toFixed(5) : undefined, // 20 pip stop loss
        takeProfit: currentPrice ? (currentPrice + 0.0030).toFixed(5) : undefined, // 30 pip take profit
        strategyId: selectedStrategy?.id || 'test-strategy',
        userId: 'test-user'
      };

      const oandaConfig = {
        accountId: config.accountId,
        apiKey: config.apiKey,
        environment: config.environment
      };

      console.log('Executing test trade:', testSignal);
      console.log('Using OANDA config:', { 
        accountId: oandaConfig.accountId, 
        environment: oandaConfig.environment,
        apiKeyLength: oandaConfig.apiKey?.length 
      });
      
      const response = await supabase.functions.invoke('oanda-trade-executor', {
        body: {
          signal: testSignal,
          config: oandaConfig,
          testMode: false // Use real mode for actual validation
        }
      });

      console.log('Trade response:', response);

      if (response.error) {
        console.error('Supabase function error:', response.error);
        throw new Error(response.error.message || 'Trade execution failed');
      }

      if (response.data?.success) {
        const result = response.data.result;
        const transactionId = result?.orderCreateTransaction?.id || result?.transactionID || 'N/A';
        
        toast({
          title: "✅ Test Trade Executed Successfully!",
          description: `${testSignal.action} order for ${testSignal.units} units of ${testSignal.symbol} placed. Transaction ID: ${transactionId}. This validates your forward testing setup is working correctly.`,
        });
        
        console.log('Test trade result:', result);
        
        // Store the successful test for analytics
        try {
          const testRecord = {
            timestamp: new Date().toISOString(),
            action: testSignal.action,
            symbol: testSignal.symbol,
            units: testSignal.units,
            transaction_id: transactionId,
            environment: config.environment,
            status: 'success',
            current_price: currentPrice
          };
          
          localStorage.setItem('last_test_trade', JSON.stringify(testRecord));
        } catch (storageError) {
          console.error('Failed to store test record:', storageError);
        }
        
      } else {
        console.error('Trade execution failed:', response.data);
        throw new Error(response.data?.error || 'Trade execution failed');
      }

    } catch (error) {
      console.error('Test trade error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "❌ Test Trade Failed",
        description: `Error: ${errorMessage}. Please check your OANDA credentials, account permissions, and ensure you have sufficient balance.`,
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
