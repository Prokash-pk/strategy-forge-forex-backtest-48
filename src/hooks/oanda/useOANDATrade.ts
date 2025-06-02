
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
      // Convert symbol to OANDA format
      let symbol = selectedStrategy?.symbol || 'EURUSD';
      
      // Handle different symbol formats
      if (symbol.includes('=X')) {
        // Yahoo Finance format like USDJPY=X
        symbol = symbol.replace('=X', '');
      }
      
      if (symbol.includes('/')) {
        // Format like EUR/USD
        symbol = symbol.replace('/', '_');
      } else if (symbol.length === 6 && !symbol.includes('_')) {
        // Format like EURUSD - convert to EUR_USD
        symbol = `${symbol.slice(0, 3)}_${symbol.slice(3)}`;
      }

      // Get current market price first to set appropriate stop loss and take profit
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
      let spread = 0;
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        if (priceData.prices && priceData.prices.length > 0) {
          const pricing = priceData.prices[0];
          const bidPrice = parseFloat(pricing.bids[0].price);
          const askPrice = parseFloat(pricing.asks[0].price);
          currentPrice = askPrice; // Use ask price for BUY orders
          spread = askPrice - bidPrice;
          console.log('Current bid/ask for', symbol, ':', bidPrice, '/', askPrice, 'spread:', spread);
        }
      }

      if (!currentPrice) {
        throw new Error('Could not fetch current market price. Please check if the symbol is valid and markets are open.');
      }

      // Calculate proper stop loss and take profit levels
      // For BUY orders: SL below current price, TP above current price
      // Use minimum of 10 pips or 3x spread, whichever is larger
      const minDistance = Math.max(0.001, spread * 3); // Minimum 10 pips or 3x spread
      
      const stopLossPrice = (currentPrice - minDistance * 2).toFixed(5); // 2x min distance below
      const takeProfitPrice = (currentPrice + minDistance * 3).toFixed(5); // 3x min distance above

      // Create a realistic test trade signal
      const testSignal = {
        action: 'BUY' as const,
        symbol: symbol,
        units: 100, // Small test size
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice,
        strategyId: selectedStrategy?.id || 'test-strategy',
        userId: 'test-user'
      };

      const oandaConfig = {
        accountId: config.accountId,
        apiKey: config.apiKey,
        environment: config.environment
      };

      console.log('Executing test trade:', testSignal);
      console.log('Current price:', currentPrice, 'SL:', stopLossPrice, 'TP:', takeProfitPrice);
      
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
        const orderTransaction = result?.orderCreateTransaction;
        const cancelTransaction = result?.orderCancelTransaction;
        const fillTransaction = result?.orderFillTransaction;
        
        // Check if order was canceled
        if (cancelTransaction) {
          toast({
            title: "⚠️ Test Trade Canceled",
            description: `Order was created but canceled by OANDA. Reason: ${cancelTransaction.reason}. This might be due to market conditions or invalid price levels.`,
            variant: "destructive",
          });
          return;
        }
        
        // Check if order was filled
        if (fillTransaction) {
          toast({
            title: "✅ Test Trade Executed Successfully!",
            description: `BUY order for ${testSignal.units} units of ${testSignal.symbol} was filled at ${fillTransaction.price}. Transaction ID: ${fillTransaction.id}. Check your OANDA platform for details.`,
          });
        } else if (orderTransaction) {
          toast({
            title: "✅ Test Order Placed Successfully!",
            description: `BUY order for ${testSignal.units} units of ${testSignal.symbol} placed. Transaction ID: ${orderTransaction.id}. Order is pending execution.`,
          });
        }
        
        console.log('Test trade result:', result);
        
        // Store the successful test for analytics
        try {
          const testRecord = {
            timestamp: new Date().toISOString(),
            action: testSignal.action,
            symbol: testSignal.symbol,
            units: testSignal.units,
            transaction_id: orderTransaction?.id || 'N/A',
            environment: config.environment,
            status: fillTransaction ? 'filled' : (cancelTransaction ? 'canceled' : 'pending'),
            current_price: currentPrice,
            stop_loss: stopLossPrice,
            take_profit: takeProfitPrice
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
        description: `Error: ${errorMessage}. Please check your OANDA credentials, account permissions, and ensure markets are open.`,
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
