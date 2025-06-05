import { supabase } from '@/integrations/supabase/client';

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
      strategy_name: "Validated BUY/SELL Strategy",
      strategy_code: `# Validated Strategy with Enforced Directional Signals
# This strategy meets all validation requirements for forward testing

def strategy_logic(data):
    """
    ENFORCED STRUCTURE - Returns required directional signals:
    - entry: [True/False] - when to enter trades
    - exit: [True/False] - when to exit trades  
    - entry_type: ["BUY"/"SELL"/"NONE"] - REQUIRED for forward testing
    """
    
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Technical indicators
    ema_fast = TechnicalAnalysis.ema(close, 12)
    ema_slow = TechnicalAnalysis.ema(close, 26)
    ema_trend = TechnicalAnalysis.ema(close, 100)
    rsi = TechnicalAnalysis.rsi(close, 14)
    atr = TechnicalAnalysis.atr(high, low, close, 14)
    
    # REQUIRED arrays - these MUST be returned
    entry = []
    exit = []
    entry_type = []  # CRITICAL: This prevents validation errors
    
    for i in range(len(close)):
        if i < 100:  # Need enough data for all indicators
            entry.append(False)
            exit.append(False)
            entry_type.append('NONE')
        else:
            # Trend analysis
            uptrend = (ema_fast[i] > ema_slow[i] and 
                      close[i] > ema_trend[i] and
                      ema_fast[i] > ema_fast[i-1])
            
            downtrend = (ema_fast[i] < ema_slow[i] and 
                        close[i] < ema_trend[i] and
                        ema_fast[i] < ema_fast[i-1])
            
            # Momentum confirmation
            momentum_up = (close[i] > ema_fast[i] and 
                          rsi[i] > 45 and rsi[i] < 70)
            
            momentum_down = (close[i] < ema_fast[i] and 
                           rsi[i] < 55 and rsi[i] > 30)
            
            # Volatility filter
            volatility_ok = not math.isnan(atr[i]) and atr[i] > 0.0001
            
            # EXPLICIT DIRECTIONAL SIGNALS
            if uptrend and momentum_up and volatility_ok:
                entry.append(True)
                entry_type.append('BUY')  # EXPLICIT BUY signal
            elif downtrend and momentum_down and volatility_ok:
                entry.append(True)
                entry_type.append('SELL')  # EXPLICIT SELL signal
            else:
                entry.append(False)
                entry_type.append('NONE')
            
            # Exit conditions
            exit_signal = (rsi[i] > 75 or rsi[i] < 25 or not volatility_ok)
            exit.append(exit_signal)
    
    # REQUIRED: Must return all three arrays for validation
    return {
        'entry': entry,
        'exit': exit,
        'entry_type': entry_type,  # PREVENTS "missing directional signals" error
        'ema_fast': ema_fast,
        'ema_slow': ema_slow,
        'ema_trend': ema_trend,
        'rsi': rsi,
        'atr': atr,
        'validation_compliant': True
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
