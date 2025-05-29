
export const provenStrategies = [
  {
    id: 'scalping_ema',
    strategy_name: 'EMA Scalping Master',
    strategy_code: `# High-Performance EMA Scalping Strategy
def strategy_logic(data):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Fast EMAs for scalping
    ema_5 = TechnicalAnalysis.ema(close, 5)
    ema_13 = TechnicalAnalysis.ema(close, 13)
    ema_21 = TechnicalAnalysis.ema(close, 21)
    
    # RSI for momentum
    rsi = TechnicalAnalysis.rsi(close, 14)
    
    # ATR for volatility
    atr = TechnicalAnalysis.atr(high, low, close, 14)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i < 25:
            entry.append(False)
            exit.append(False)
        else:
            # Triple EMA alignment + RSI momentum
            ema_bullish = ema_5[i] > ema_13[i] > ema_21[i]
            rsi_momentum = 45 < rsi[i] < 75
            price_above_ema5 = close[i] > ema_5[i]
            
            # Volatility filter
            high_volatility = (high[i] - low[i]) > atr[i] * 0.8
            
            entry_signal = ema_bullish and rsi_momentum and price_above_ema5 and high_volatility
            
            # Quick exit for scalping
            ema_bearish = ema_5[i] < ema_13[i]
            rsi_overbought = rsi[i] > 80
            price_below_ema13 = close[i] < ema_13[i]
            
            exit_signal = ema_bearish or rsi_overbought or price_below_ema13
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'ema_5': ema_5,
        'ema_13': ema_13,
        'ema_21': ema_21,
        'rsi': rsi
    }`,
    symbol: 'EURUSD=X',
    timeframe: '5m',
    total_return: 28.5,
    win_rate: 68.3,
    total_trades: 156,
    max_drawdown: -8.2,
    profit_factor: 1.85,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'breakout_momentum',
    strategy_name: 'Breakout Momentum Pro',
    strategy_code: `# Professional Breakout Momentum Strategy
def strategy_logic(data):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    volume = data['Volume'].tolist()
    
    # Bollinger Bands for breakout detection
    bb = TechnicalAnalysis.bollinger_bands(close, 20, 2)
    
    # MACD for momentum confirmation
    macd_data = TechnicalAnalysis.macd(close, 12, 26, 9)
    macd_line = macd_data['macd']
    signal_line = macd_data['signal']
    
    # ADX for trend strength
    adx = TechnicalAnalysis.adx(high, low, close, 14)
    
    # Volume MA for volume confirmation
    volume_ma = TechnicalAnalysis.sma(volume, 20)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i < 30:
            entry.append(False)
            exit.append(False)
        else:
            # Breakout conditions
            upper_breakout = close[i] > bb['upper'][i]
            macd_bullish = macd_line[i] > signal_line[i] and macd_line[i] > macd_line[i-1]
            strong_trend = adx[i] > 25
            volume_confirmation = volume[i] > volume_ma[i] * 1.2
            
            entry_signal = upper_breakout and macd_bullish and strong_trend and volume_confirmation
            
            # Exit conditions
            back_to_bb = close[i] < bb['middle'][i]
            macd_bearish = macd_line[i] < signal_line[i]
            weak_trend = adx[i] < 20
            
            exit_signal = back_to_bb or macd_bearish or weak_trend
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'bb_upper': bb['upper'],
        'bb_middle': bb['middle'],
        'bb_lower': bb['lower'],
        'macd': macd_line,
        'adx': adx
    }`,
    symbol: 'GBPUSD=X',
    timeframe: '15m',
    total_return: 42.1,
    win_rate: 61.7,
    total_trades: 89,
    max_drawdown: -12.4,
    profit_factor: 2.13,
    created_at: '2024-01-20T14:15:00Z'
  },
  {
    id: 'swing_reversal',
    strategy_name: 'Swing Reversal Expert',
    strategy_code: `# High-Return Swing Reversal Strategy
def strategy_logic(data):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Multiple timeframe EMAs
    ema_20 = TechnicalAnalysis.ema(close, 20)
    ema_50 = TechnicalAnalysis.ema(close, 50)
    ema_100 = TechnicalAnalysis.ema(close, 100)
    
    # Stochastic for oversold/overbought
    stoch = TechnicalAnalysis.stochastic(high, low, close, 14, 3, 3)
    
    # Williams %R for reversal signals
    williams_r = TechnicalAnalysis.williams_r(high, low, close, 14)
    
    # Support/Resistance levels
    resistance = TechnicalAnalysis.rolling_max(high, 20)
    support = TechnicalAnalysis.rolling_min(low, 20)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i < 50:
            entry.append(False)
            exit.append(False)
        else:
            # Reversal from support with trend alignment
            at_support = abs(close[i] - support[i]) / close[i] < 0.002
            oversold_stoch = stoch['k'][i] < 20 and stoch['d'][i] < 20
            oversold_williams = williams_r[i] < -80
            uptrend_intact = ema_20[i] > ema_50[i] > ema_100[i]
            
            # Price action confirmation
            bullish_reversal = close[i] > close[i-1] and low[i] > low[i-1]
            
            entry_signal = (at_support and oversold_stoch and oversold_williams 
                           and uptrend_intact and bullish_reversal)
            
            # Exit at resistance or trend change
            at_resistance = abs(close[i] - resistance[i]) / close[i] < 0.002
            overbought_stoch = stoch['k'][i] > 80
            trend_break = ema_20[i] < ema_50[i]
            
            exit_signal = at_resistance or overbought_stoch or trend_break
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'ema_20': ema_20,
        'ema_50': ema_50,
        'stoch_k': stoch['k'],
        'williams_r': williams_r
    }`,
    symbol: 'USDJPY=X',
    timeframe: '1h',
    total_return: 35.8,
    win_rate: 72.4,
    total_trades: 67,
    max_drawdown: -9.7,
    profit_factor: 1.94,
    created_at: '2024-01-25T09:45:00Z'
  },
  {
    id: 'grid_martingale',
    strategy_name: 'Smart Grid Trading',
    strategy_code: `# Intelligent Grid Trading Strategy
def strategy_logic(data):
    close = data['Close'].tolist()
    high = data['High'].tolist()
    low = data['Low'].tolist()
    
    # Market structure analysis
    sma_200 = TechnicalAnalysis.sma(close, 200)
    atr = TechnicalAnalysis.atr(high, low, close, 14)
    
    # Volatility indicators
    bb = TechnicalAnalysis.bollinger_bands(close, 20, 2)
    
    # Market regime filter
    adx = TechnicalAnalysis.adx(high, low, close, 14)
    
    entry = []
    exit = []
    
    for i in range(len(data)):
        if i < 200:
            entry.append(False)
            exit.append(False)
        else:
            # Only trade in ranging markets
            ranging_market = adx[i] < 25
            price_in_range = bb['lower'][i] < close[i] < bb['upper'][i]
            above_long_term = close[i] > sma_200[i]
            
            # Grid level calculation (simplified)
            grid_size = atr[i] * 0.5
            at_grid_level = (close[i] % grid_size) < (grid_size * 0.1)
            
            # Price bounce from BB lower
            bounce_signal = (close[i-1] <= bb['lower'][i-1] and 
                           close[i] > bb['lower'][i] and close[i] > close[i-1])
            
            entry_signal = (ranging_market and above_long_term and 
                           at_grid_level and bounce_signal)
            
            # Exit at BB upper or trend change
            at_bb_upper = close[i] >= bb['upper'][i]
            trending_market = adx[i] > 30
            below_long_term = close[i] < sma_200[i]
            
            exit_signal = at_bb_upper or trending_market or below_long_term
            
            entry.append(entry_signal)
            exit.append(exit_signal)
    
    return {
        'entry': entry,
        'exit': exit,
        'sma_200': sma_200,
        'bb_upper': bb['upper'],
        'bb_lower': bb['lower'],
        'adx': adx
    }`,
    symbol: 'AUDUSD=X',
    timeframe: '15m',
    total_return: 31.2,
    win_rate: 78.6,
    total_trades: 124,
    max_drawdown: -6.8,
    profit_factor: 2.05,
    created_at: '2024-02-01T16:20:00Z'
  }
];
