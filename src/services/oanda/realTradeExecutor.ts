
import { supabase } from '@/integrations/supabase/client';

export interface TradeRequest {
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  units: number;
  stopLoss?: number;
  takeProfit?: number;
  confidence?: number;
}

export interface TradeResult {
  success: boolean;
  tradeId?: string;
  fillPrice?: number;
  error?: string;
  orderId?: string;
}

export interface OANDAAccountInfo {
  balance: number;
  unrealizedPL: number;
  openPositionCount: number;
  currency: string;
}

export class RealOANDATradeExecutor {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(
    private accountId: string,
    private apiKey: string,
    private environment: 'practice' | 'live'
  ) {
    this.baseUrl = environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com';
    
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept-Datetime-Format': 'UNIX'
    };
  }

  async getCurrentPrice(symbol: string): Promise<{ bid: number; ask: number; spread: number } | null> {
    try {
      const oandaSymbol = this.formatSymbol(symbol);
      const response = await fetch(
        `${this.baseUrl}/v3/accounts/${this.accountId}/pricing?instruments=${oandaSymbol}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        console.error('Failed to fetch price:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.prices && data.prices.length > 0) {
        const pricing = data.prices[0];
        const bid = parseFloat(pricing.bids[0].price);
        const ask = parseFloat(pricing.asks[0].price);
        
        return {
          bid,
          ask,
          spread: ask - bid
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching current price:', error);
      return null;
    }
  }

  async getAccountInfo(): Promise<OANDAAccountInfo | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v3/accounts/${this.accountId}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        console.error('Failed to fetch account info:', response.status);
        return null;
      }

      const data = await response.json();
      const account = data.account;

      return {
        balance: parseFloat(account.balance),
        unrealizedPL: parseFloat(account.unrealizedPL),
        openPositionCount: parseInt(account.openPositionCount),
        currency: account.currency
      };
    } catch (error) {
      console.error('Error fetching account info:', error);
      return null;
    }
  }

  async getOpenPositions(symbol?: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v3/accounts/${this.accountId}/positions`,
        { headers: this.headers }
      );

      if (!response.ok) {
        console.error('Failed to fetch positions:', response.status);
        return [];
      }

      const data = await response.json();
      let positions = data.positions || [];

      if (symbol) {
        const oandaSymbol = this.formatSymbol(symbol);
        positions = positions.filter((pos: any) => pos.instrument === oandaSymbol);
      }

      return positions.filter((pos: any) => 
        parseFloat(pos.long.units) !== 0 || parseFloat(pos.short.units) !== 0
      );
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }

  async executeTrade(request: TradeRequest): Promise<TradeResult> {
    try {
      console.log('🚀 Executing REAL OANDA trade:', request);

      // Get current market price
      const currentPrice = await this.getCurrentPrice(request.symbol);
      if (!currentPrice) {
        throw new Error('Unable to fetch current market price');
      }

      // Check for existing positions to prevent duplicates
      const existingPositions = await this.getOpenPositions(request.symbol);
      if (existingPositions.length > 0 && request.action !== 'CLOSE') {
        console.log('⚠️ Position already exists for', request.symbol);
        return {
          success: false,
          error: 'Position already exists for this instrument'
        };
      }

      // Handle CLOSE action
      if (request.action === 'CLOSE') {
        return await this.closePosition(request.symbol);
      }

      // Calculate stop loss and take profit if not provided
      const entryPrice = request.action === 'BUY' ? currentPrice.ask : currentPrice.bid;
      const stopLoss = request.stopLoss || this.calculateStopLoss(entryPrice, request.action);
      const takeProfit = request.takeProfit || this.calculateTakeProfit(entryPrice, request.action);

      // Create order data
      const orderData = {
        order: {
          type: 'MARKET',
          instrument: this.formatSymbol(request.symbol),
          units: request.action === 'BUY' ? request.units.toString() : (-request.units).toString(),
          timeInForce: 'FOK',
          positionFill: 'DEFAULT',
          stopLossOnFill: {
            price: stopLoss.toFixed(5),
            timeInForce: 'GTC'
          },
          takeProfitOnFill: {
            price: takeProfit.toFixed(5),
            timeInForce: 'GTC'
          }
        }
      };

      console.log('📤 Sending order to OANDA:', JSON.stringify(orderData, null, 2));

      // Execute the order
      const response = await fetch(
        `${this.baseUrl}/v3/accounts/${this.accountId}/orders`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(orderData)
        }
      );

      const result = await response.json();
      console.log('📥 OANDA response:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(`OANDA API Error: ${result.errorMessage || response.statusText}`);
      }

      // Log the successful trade
      await this.logRealTrade(request, result, entryPrice);

      const tradeResult: TradeResult = {
        success: true,
        orderId: result.orderCreateTransaction?.id,
        tradeId: result.orderFillTransaction?.id,
        fillPrice: parseFloat(result.orderFillTransaction?.price || entryPrice.toString())
      };

      console.log('✅ REAL TRADE EXECUTED SUCCESSFULLY:', tradeResult);
      return tradeResult;

    } catch (error) {
      console.error('❌ REAL TRADE EXECUTION FAILED:', error);
      
      // Log the failed trade attempt
      await this.logFailedTrade(request, error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async closePosition(symbol: string): Promise<TradeResult> {
    try {
      const oandaSymbol = this.formatSymbol(symbol);
      const response = await fetch(
        `${this.baseUrl}/v3/accounts/${this.accountId}/positions/${oandaSymbol}/close`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({
            longUnits: 'ALL',
            shortUnits: 'ALL'
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`OANDA Close Error: ${result.errorMessage || response.statusText}`);
      }

      return {
        success: true,
        tradeId: result.longOrderFillTransaction?.id || result.shortOrderFillTransaction?.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private calculateStopLoss(entryPrice: number, action: 'BUY' | 'SELL'): number {
    const stopLossDistance = entryPrice * 0.01; // 1% stop loss
    return action === 'BUY' 
      ? entryPrice - stopLossDistance 
      : entryPrice + stopLossDistance;
  }

  private calculateTakeProfit(entryPrice: number, action: 'BUY' | 'SELL'): number {
    const takeProfitDistance = entryPrice * 0.02; // 2% take profit
    return action === 'BUY' 
      ? entryPrice + takeProfitDistance 
      : entryPrice - takeProfitDistance;
  }

  private formatSymbol(symbol: string): string {
    if (symbol.includes('/')) {
      return symbol.replace('/', '_');
    } else if (symbol.includes('=X')) {
      return symbol.replace('=X', '').replace(/(.{3})(.{3})/, '$1_$2');
    } else if (symbol.length === 6 && !symbol.includes('_')) {
      return symbol.replace(/(.{3})(.{3})/, '$1_$2');
    }
    return symbol;
  }

  private async logRealTrade(request: TradeRequest, oandaResult: any, entryPrice: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('trading_logs').insert({
        user_id: user.id,
        session_id: crypto.randomUUID(),
        log_type: 'trade_execution',
        message: `REAL TRADE EXECUTED: ${request.action} ${request.units} units of ${request.symbol} at ${entryPrice}`,
        trade_data: {
          execution_type: 'REAL_TRADE',
          symbol: request.symbol,
          action: request.action,
          units: request.units,
          entry_price: entryPrice,
          confidence: request.confidence,
          oanda_order_id: oandaResult.orderCreateTransaction?.id,
          oanda_trade_id: oandaResult.orderFillTransaction?.id,
          stop_loss: oandaResult.orderCreateTransaction?.stopLossOnFill?.price,
          take_profit: oandaResult.orderCreateTransaction?.takeProfitOnFill?.price,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log real trade:', error);
    }
  }

  private async logFailedTrade(request: TradeRequest, error: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('trading_logs').insert({
        user_id: user.id,
        session_id: crypto.randomUUID(),
        log_type: 'error',
        message: `REAL TRADE FAILED: ${request.action} ${request.units} units of ${request.symbol} - ${error}`,
        trade_data: {
          execution_type: 'REAL_TRADE_FAILED',
          symbol: request.symbol,
          action: request.action,
          units: request.units,
          error: error,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log failed trade:', logError);
    }
  }
}
