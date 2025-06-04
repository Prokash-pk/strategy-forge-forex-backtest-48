
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AutoStrategyConfig {
  strategy_name: string;
  strategy_code: string;
  symbol: string;
  timeframe: string;
  user_id: string;
  initial_balance: number;
  risk_per_trade: number;
  stop_loss: number;
  take_profit: number;
  spread: number;
  commission: number;
  slippage: number;
  max_position_size: number;
  risk_model: string;
  position_sizing_mode: string;
  risk_reward_ratio: number;
  reverse_signals: boolean;
}

export class AutoStrategyService {
  static async getDefaultBuySellStrategy(): Promise<AutoStrategyConfig> {
    const defaultStrategy = {
      strategy_name: "Smart Momentum Strategy with BUY/SELL Signals",
      strategy_code: `# Smart Momentum Strategy with Proper BUY/SELL Signals
# This strategy defines clear directional signals for forward testing

def strategy_logic(data, reverse_signals=False):
    """
    Enhanced momentum strategy with proper BUY/SELL directional signals:
    - EMA trend filtering
    - RSI momentum confirmation
    - Volatility-based entry timing
    - EXPLICIT BUY/SELL signal generation for forward testing
    - Reverse signal capability for testing both directions
    """
    
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Technical indicators
    ema_fast = TechnicalAnalysis.ema(close, 21)
    ema_slow = TechnicalAnalysis.ema(close, 55)
    ema_trend = TechnicalAnalysis.ema(close, 200)
    rsi = TechnicalAnalysis.rsi(close, 14)
    atr = TechnicalAnalysis.atr(high, low, close, 14)
    atr_avg = TechnicalAnalysis.sma(atr, 20)
    
    entry = []
    exit = []
    trade_direction = []  # CRITICAL: This provides BUY/SELL direction
    
    for i in range(len(close)):
        if i < 200:
            entry.append(False)
            exit.append(False)
            trade_direction.append('NONE')
        else:
            # Trend conditions
            uptrend = ema_fast[i] > ema_slow[i] and close[i] > ema_trend[i]
            downtrend = ema_fast[i] < ema_slow[i] and close[i] < ema_trend[i]
            
            # Momentum conditions
            momentum_up = close[i] > ema_fast[i] and rsi[i] > 50 and rsi[i] < 75
            momentum_down = close[i] < ema_fast[i] and rsi[i] < 50 and rsi[i] > 25
            
            # Volatility filter
            high_vol = atr[i] > atr_avg[i] * 1.2
            
            # Entry conditions
            long_signal = uptrend and momentum_up and high_vol
            short_signal = downtrend and momentum_down and high_vol
            
            # Apply reverse signals if enabled (for testing opposite direction)
            if reverse_signals:
                actual_long = short_signal
                actual_short = long_signal
            else:
                actual_long = long_signal
                actual_short = short_signal
            
            # Generate EXPLICIT directional signals for forward testing
            if actual_long:
                entry.append(True)
                trade_direction.append('BUY')  # EXPLICIT BUY signal
            elif actual_short:
                entry.append(True)
                trade_direction.append('SELL')  # EXPLICIT SELL signal
            else:
                entry.append(False)
                trade_direction.append('NONE')
            
            # Exit conditions
            exit_signal = rsi[i] > 80 or rsi[i] < 20 or not high_vol
            exit.append(exit_signal)
    
    # CRITICAL: Return trade_direction for forward testing
    return {
        'entry': entry,
        'exit': exit,
        'trade_direction': trade_direction,  # This is what forward testing needs
        'ema_fast': ema_fast,
        'ema_slow': ema_slow,
        'ema_trend': ema_trend,
        'rsi': rsi,
        'atr': atr,
        'reverse_signals_applied': reverse_signals,
        'note': 'Strategy with proper BUY/SELL directional signals for forward testing'
    }`,
      symbol: "EURUSD=X",
      timeframe: "1h",
      user_id: "",
      initial_balance: 10000,
      risk_per_trade: 2,
      stop_loss: 40,
      take_profit: 80,
      spread: 1.5,
      commission: 0,
      slippage: 0.5,
      max_position_size: 100000,
      risk_model: "fixed",
      position_sizing_mode: "manual",
      risk_reward_ratio: 2,
      reverse_signals: false
    };

    return defaultStrategy;
  }

  static async autoSaveAndSelectStrategy(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return null;
      }

      // Check if strategy already exists
      const { data: existingStrategies } = await supabase
        .from('strategy_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('strategy_name', 'Smart Momentum Strategy with BUY/SELL Signals');

      let strategyId: string;

      if (existingStrategies && existingStrategies.length > 0) {
        // Use existing strategy
        strategyId = existingStrategies[0].id;
        console.log('✅ Using existing BUY/SELL strategy:', strategyId);
      } else {
        // Create new strategy
        const defaultStrategy = await this.getDefaultBuySellStrategy();
        defaultStrategy.user_id = user.id;

        const { data, error } = await supabase
          .from('strategy_results')
          .insert({
            ...defaultStrategy,
            win_rate: 0,
            total_return: 0,
            total_trades: 0,
            profit_factor: 0,
            max_drawdown: 0
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to save strategy:', error);
          return null;
        }

        strategyId = data.id;
        console.log('✅ Auto-saved BUY/SELL strategy:', strategyId);
      }

      // Auto-select this strategy in localStorage
      const strategySettings = {
        id: strategyId,
        strategy_name: 'Smart Momentum Strategy with BUY/SELL Signals',
        strategy_code: (await this.getDefaultBuySellStrategy()).strategy_code,
        symbol: 'EURUSD=X',
        timeframe: '1h',
        initial_balance: 10000,
        risk_per_trade: 2,
        stop_loss: 40,
        take_profit: 80,
        spread: 1.5,
        commission: 0,
        slippage: 0.5,
        max_position_size: 100000,
        risk_model: 'fixed',
        reverse_signals: false,
        position_sizing_mode: 'manual',
        risk_reward_ratio: 2
      };

      localStorage.setItem('selected_strategy_settings', JSON.stringify(strategySettings));
      console.log('✅ Auto-selected BUY/SELL strategy in localStorage');

      return strategyId;
    } catch (error) {
      console.error('Auto-save strategy failed:', error);
      return null;
    }
  }

  static async getOANDACredentials(): Promise<{accountId: string, apiKey: string, environment: string} | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return null;
      }

      const { data: configs } = await supabase
        .from('oanda_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (configs && configs.length > 0) {
        const config = configs[0];
        console.log('✅ Retrieved OANDA credentials from Supabase');
        return {
          accountId: config.account_id,
          apiKey: config.api_key,
          environment: config.environment
        };
      } else {
        console.error('❌ No OANDA credentials found in Supabase');
        return null;
      }
    } catch (error) {
      console.error('Failed to retrieve OANDA credentials:', error);
      return null;
    }
  }
}
