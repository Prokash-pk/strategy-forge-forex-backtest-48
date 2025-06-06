
import { supabase } from '@/integrations/supabase/client';
import { RealOANDATradeExecutor, TradeRequest } from '../oanda/realTradeExecutor';

export interface StrategySignal {
  signal: 'BUY' | 'SELL' | 'CLOSE' | 'NONE';
  symbol: string;
  confidence: number;
  currentPrice: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  strategyName: string;
}

export interface TradingConfig {
  riskPercentage: number;
  maxPositionSize: number;
  minConfidence: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
}

export class SignalToTradeBridge {
  private tradeExecutor: RealOANDATradeExecutor;
  private config: TradingConfig;

  constructor(
    accountId: string,
    apiKey: string,
    environment: 'practice' | 'live',
    config?: Partial<TradingConfig>
  ) {
    this.tradeExecutor = new RealOANDATradeExecutor(accountId, apiKey, environment);
    this.config = {
      riskPercentage: 2.0,
      maxPositionSize: 10000,
      minConfidence: 70,
      stopLossPercentage: 1.0,
      takeProfitPercentage: 2.0,
      ...config
    };
  }

  async processSignal(signal: StrategySignal): Promise<{ success: boolean; message: string; tradeId?: string }> {
    try {
      console.log('🔍 Processing strategy signal:', signal);

      // Filter by confidence threshold
      if (signal.confidence < this.config.minConfidence) {
        const message = `Signal confidence ${signal.confidence}% below threshold ${this.config.minConfidence}%`;
        console.log('⚠️', message);
        await this.logSignalProcessing(signal, 'FILTERED_LOW_CONFIDENCE', message);
        return { success: false, message };
      }

      // Skip if no actionable signal
      if (signal.signal === 'NONE') {
        const message = 'No actionable signal detected';
        console.log('📊', message);
        await this.logSignalProcessing(signal, 'NO_SIGNAL', message);
        return { success: false, message };
      }

      // Get account info for risk management
      const accountInfo = await this.tradeExecutor.getAccountInfo();
      if (!accountInfo) {
        const message = 'Unable to fetch account information';
        console.error('❌', message);
        return { success: false, message };
      }

      // Calculate position size based on risk management
      const positionSize = this.calculatePositionSize(
        accountInfo.balance,
        signal.currentPrice,
        this.config.riskPercentage
      );

      if (positionSize === 0) {
        const message = 'Position size calculated as 0 - insufficient funds or high risk';
        console.log('⚠️', message);
        return { success: false, message };
      }

      // Check for existing positions to prevent duplicates
      const existingPositions = await this.tradeExecutor.getOpenPositions(signal.symbol);
      if (existingPositions.length > 0 && signal.signal !== 'CLOSE') {
        const message = `Position already exists for ${signal.symbol}`;
        console.log('⚠️', message);
        await this.logSignalProcessing(signal, 'DUPLICATE_POSITION', message);
        return { success: false, message };
      }

      // Prepare trade request
      const tradeRequest: TradeRequest = {
        symbol: signal.symbol,
        action: signal.signal,
        units: positionSize,
        confidence: signal.confidence,
        stopLoss: signal.stopLoss || this.calculateStopLoss(signal.currentPrice, signal.signal),
        takeProfit: signal.takeProfit || this.calculateTakeProfit(signal.currentPrice, signal.signal)
      };

      // Execute the trade
      console.log('🚀 Executing real trade from signal:', tradeRequest);
      const tradeResult = await this.tradeExecutor.executeTrade(tradeRequest);

      if (tradeResult.success) {
        const message = `Real trade executed successfully: ${signal.signal} ${positionSize} units of ${signal.symbol}`;
        console.log('✅', message);
        await this.logSignalProcessing(signal, 'TRADE_EXECUTED', message, tradeResult.tradeId);
        return { 
          success: true, 
          message, 
          tradeId: tradeResult.tradeId 
        };
      } else {
        const message = `Trade execution failed: ${tradeResult.error}`;
        console.error('❌', message);
        await this.logSignalProcessing(signal, 'TRADE_FAILED', message);
        return { success: false, message };
      }

    } catch (error) {
      const message = `Signal processing error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', message);
      await this.logSignalProcessing(signal, 'PROCESSING_ERROR', message);
      return { success: false, message };
    }
  }

  private calculatePositionSize(accountBalance: number, currentPrice: number, riskPercentage: number): number {
    // Calculate position size based on risk management
    const riskAmount = accountBalance * (riskPercentage / 100);
    const stopLossDistance = currentPrice * (this.config.stopLossPercentage / 100);
    
    // Calculate units based on risk and stop loss
    let units = Math.floor(riskAmount / stopLossDistance);
    
    // Apply maximum position size limit
    units = Math.min(units, this.config.maxPositionSize);
    
    // Ensure minimum viable trade size
    if (units < 100) {
      units = 0; // Too small to trade
    }

    console.log('💰 Position sizing:', {
      accountBalance,
      currentPrice,
      riskAmount,
      stopLossDistance,
      calculatedUnits: units
    });

    return units;
  }

  private calculateStopLoss(currentPrice: number, action: 'BUY' | 'SELL' | 'CLOSE'): number {
    if (action === 'CLOSE') return 0;
    
    const stopLossDistance = currentPrice * (this.config.stopLossPercentage / 100);
    return action === 'BUY' 
      ? currentPrice - stopLossDistance 
      : currentPrice + stopLossDistance;
  }

  private calculateTakeProfit(currentPrice: number, action: 'BUY' | 'SELL' | 'CLOSE'): number {
    if (action === 'CLOSE') return 0;
    
    const takeProfitDistance = currentPrice * (this.config.takeProfitPercentage / 100);
    return action === 'BUY' 
      ? currentPrice + takeProfitDistance 
      : currentPrice - takeProfitDistance;
  }

  private async logSignalProcessing(
    signal: StrategySignal, 
    status: string, 
    message: string, 
    tradeId?: string
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('trading_logs').insert({
        user_id: user.id,
        session_id: crypto.randomUUID(),
        log_type: status.includes('ERROR') || status.includes('FAILED') ? 'error' : 'info',
        message: `SIGNAL PROCESSING: ${message}`,
        trade_data: {
          signal_processing: {
            signal: signal.signal,
            symbol: signal.symbol,
            confidence: signal.confidence,
            current_price: signal.currentPrice,
            strategy_name: signal.strategyName,
            status: status,
            trade_id: tradeId,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Failed to log signal processing:', error);
    }
  }

  // Static factory method to create bridge from saved OANDA config
  static async createFromSavedConfig(strategyId: string, userId: string): Promise<SignalToTradeBridge | null> {
    try {
      // Get OANDA config from database
      const { data: configs, error } = await supabase
        .from('oanda_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .limit(1);

      if (error || !configs || configs.length === 0) {
        console.error('No OANDA configuration found for user:', userId);
        return null;
      }

      const config = configs[0];
      
      return new SignalToTradeBridge(
        config.account_id,
        config.api_key,
        config.environment as 'practice' | 'live'
      );
    } catch (error) {
      console.error('Failed to create SignalToTradeBridge from saved config:', error);
      return null;
    }
  }
}
