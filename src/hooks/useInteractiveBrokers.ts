import { useState, useEffect } from 'react';
import { InteractiveBrokersService, IBConfig, IBTrade } from '@/services/interactiveBrokersService';
import { useToast } from '@/hooks/use-toast';

export const useInteractiveBrokers = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<IBConfig>(InteractiveBrokersService.getConfig());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [positions, setPositions] = useState(InteractiveBrokersService.getPositions());
  const [orders, setOrders] = useState(InteractiveBrokersService.getOrders());
  const [accountSummary, setAccountSummary] = useState(InteractiveBrokersService.getAccountSummary());

  useEffect(() => {
    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(InteractiveBrokersService.isConnected());
      setPositions(InteractiveBrokersService.getPositions());
      setOrders(InteractiveBrokersService.getOrders());
      setAccountSummary(InteractiveBrokersService.getAccountSummary());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleConfigChange = (key: keyof IBConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const connect = async (): Promise<boolean> => {
    setIsConnecting(true);
    try {
      await InteractiveBrokersService.connect(config);
      setIsConnected(true);
      toast({
        title: "Connected to Interactive Brokers! ✅",
        description: `Connected to ${config.paperTrading ? 'Paper Trading' : 'Live Trading'} account`,
      });
      return true;
    } catch (error) {
      console.error('IB Connection failed:', error);
      toast({
        title: "Connection Failed ❌",
        description: error instanceof Error ? error.message : "Failed to connect to IB",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    InteractiveBrokersService.disconnect();
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "Disconnected from Interactive Brokers",
    });
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      const result = await InteractiveBrokersService.testConnection(config);
      
      if (result.success) {
        toast({
          title: "Connection Test Successful! ✅",
          description: result.message,
        });
        return true;
      } else {
        toast({
          title: "Connection Test Failed ❌",
          description: result.message,
          variant: "destructive",
        });
        console.error('Connection test details:', result.details);
        return false;
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast({
        title: "Connection Test Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const sendBacktestSignalsToIB = async (
    backtestResults: any,
    symbol: string,
    strategyName: string
  ): Promise<boolean> => {
    try {
      if (!isConnected) {
        toast({
          title: "IB Not Connected",
          description: "Please connect to Interactive Brokers first",
          variant: "destructive",
        });
        return false;
      }

      const trades = InteractiveBrokersService.processBacktestSignals(
        backtestResults,
        symbol,
        strategyName
      );

      if (trades.length === 0) {
        toast({
          title: "No Signals Generated",
          description: "The backtest didn't generate any trading signals",
          variant: "destructive",
        });
        return false;
      }

      // Send trades to IB with delay between each trade
      let successCount = 0;
      for (const trade of trades) {
        const orderId = await InteractiveBrokersService.placeTrade(trade);
        if (orderId) {
          successCount++;
        }
        // Small delay between trades
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: `Signals Sent to Interactive Brokers! 📤`,
        description: `${successCount}/${trades.length} trades submitted successfully`,
      });

      return successCount > 0;
    } catch (error) {
      console.error('Failed to send signals to IB:', error);
      toast({
        title: "Failed to Send Signals",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const placeTrade = async (trade: IBTrade): Promise<boolean> => {
    try {
      if (!isConnected) {
        toast({
          title: "IB Not Connected",
          description: "Please connect to Interactive Brokers first",
          variant: "destructive",
        });
        return false;
      }

      const orderId = await InteractiveBrokersService.placeTrade(trade);
      
      if (orderId) {
        toast({
          title: "Trade Submitted! 📤",
          description: `${trade.action} ${trade.quantity} ${trade.symbol} - Order ID: ${orderId}`,
        });
        return true;
      } else {
        toast({
          title: "Trade Failed",
          description: "Failed to submit trade to Interactive Brokers",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to place trade:', error);
      toast({
        title: "Trade Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const closePosition = async (symbol: string): Promise<boolean> => {
    try {
      const success = await InteractiveBrokersService.closePosition(symbol);
      
      if (success) {
        toast({
          title: "Position Closed! 📤",
          description: `Closing position for ${symbol}`,
        });
      } else {
        toast({
          title: "Close Position Failed",
          description: `Failed to close position for ${symbol}`,
          variant: "destructive",
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to close position:', error);
      toast({
        title: "Close Position Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    config,
    isConnected,
    isConnecting,
    positions,
    orders,
    accountSummary,
    handleConfigChange,
    connect,
    disconnect,
    testConnection,
    sendBacktestSignalsToIB,
    placeTrade,
    closePosition
  };
};
