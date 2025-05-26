
export const analyzeStrategy = (code: string, timeframe: string) => {
  // Extract strategy type and parameters from code
  const isEMA = code.toLowerCase().includes('ema');
  const isRSI = code.toLowerCase().includes('rsi');
  const isBollinger = code.toLowerCase().includes('bollinger');
  const isMACD = code.toLowerCase().includes('macd');
  
  // Get timeframe multiplier for trade frequency
  const timeframeMultipliers: Record<string, number> = {
    '1m': 1.8,
    '5m': 1.4,
    '15m': 1.0,
    '1h': 0.6,
    '1d': 0.2
  };
  
  const multiplier = timeframeMultipliers[timeframe] || 1;
  
  // Strategy-specific base parameters
  let baseTrades, baseWinRate, baseReturn;
  
  if (isEMA) {
    baseTrades = Math.floor(45 * multiplier);
    baseWinRate = 58 + Math.random() * 8;
    baseReturn = 15 + Math.random() * 20;
  } else if (isRSI) {
    baseTrades = Math.floor(32 * multiplier);
    baseWinRate = 62 + Math.random() * 12;
    baseReturn = 8 + Math.random() * 25;
  } else if (isBollinger) {
    baseTrades = Math.floor(28 * multiplier);
    baseWinRate = 55 + Math.random() * 10;
    baseReturn = 12 + Math.random() * 18;
  } else if (isMACD) {
    baseTrades = Math.floor(38 * multiplier);
    baseWinRate = 60 + Math.random() * 8;
    baseReturn = 10 + Math.random() * 22;
  } else {
    // Custom strategy - more variable
    baseTrades = Math.floor((20 + Math.random() * 40) * multiplier);
    baseWinRate = 45 + Math.random() * 25;
    baseReturn = -5 + Math.random() * 35;
  }
  
  return { baseTrades, baseWinRate, baseReturn };
};

export const generateDynamicEquityCurve = (initial: number, final: number, trades: number) => {
  const points = [];
  let balance = initial;
  const totalGain = final - initial;
  const volatility = Math.abs(totalGain) * 0.3;
  
  for (let i = 0; i <= 100; i++) {
    const progress = i / 100;
    const trend = initial + (totalGain * progress);
    const noise = (Math.random() - 0.5) * volatility * (1 - progress * 0.5);
    balance = trend + noise;
    
    points.push({ 
      date: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000), 
      balance: Math.max(initial * 0.7, balance)
    });
  }
  return points;
};

export const generateDynamicTrades = (totalTrades: number, avgWin: number, avgLoss: number, winRate: number) => {
  const trades = [];
  const winProbability = winRate / 100;
  
  for (let i = 1; i <= totalTrades; i++) {
    const isWin = Math.random() < winProbability;
    const basePrice = 1.0800 + (Math.random() - 0.5) * 0.02;
    const pnl = isWin ? 
      avgWin * (0.8 + Math.random() * 0.4) : 
      avgLoss * (0.8 + Math.random() * 0.4);
    
    trades.push({
      id: i,
      date: new Date(Date.now() - (totalTrades - i) * 2 * 60 * 60 * 1000),
      type: Math.random() > 0.5 ? 'BUY' : 'SELL',
      entry: basePrice,
      exit: basePrice + (pnl / 100000),
      pnl: Math.round(pnl * 100) / 100,
      duration: Math.floor(Math.random() * 240) + 15
    });
  }
  return trades;
};
