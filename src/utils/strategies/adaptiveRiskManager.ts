
export class AdaptiveRiskManager {
  static calculateOptimalStopLoss(
    atr: number[],
    currentIndex: number,
    baseStopPips: number = 50
  ): number {
    if (currentIndex < 14 || !atr[currentIndex] || isNaN(atr[currentIndex])) {
      return baseStopPips;
    }
    
    // Adaptive stop loss based on volatility
    const currentATR = atr[currentIndex];
    const avgATR = atr.slice(Math.max(0, currentIndex - 20), currentIndex)
      .filter(x => !isNaN(x))
      .reduce((sum, val) => sum + val, 0) / 20;
    
    const volatilityMultiplier = currentATR / (avgATR || currentATR);
    
    // Adjust stop loss: tighter in low volatility, wider in high volatility
    const adjustedStop = baseStopPips * Math.max(0.5, Math.min(2.0, volatilityMultiplier));
    
    return Math.round(adjustedStop);
  }
  
  static calculateOptimalTakeProfit(
    stopLoss: number,
    signalQuality: number,
    baseRatio: number = 1.5
  ): number {
    // Better signals get better risk/reward ratios
    const qualityMultiplier = signalQuality >= 80 ? 2.0 : 
                             signalQuality >= 70 ? 1.5 : 1.0;
    
    return Math.round(stopLoss * baseRatio * qualityMultiplier);
  }
  
  static calculatePositionSize(
    accountBalance: number,
    riskPercent: number,
    stopLossPips: number,
    signalQuality: number
  ): number {
    // Reduce position size for lower quality signals
    const qualityFactor = signalQuality >= 80 ? 1.0 :
                         signalQuality >= 70 ? 0.75 : 0.5;
    
    const riskAmount = (accountBalance * riskPercent * qualityFactor) / 100;
    const pipValue = 0.0001;
    const stopLossDistance = stopLossPips * pipValue;
    
    return Math.min(riskAmount / stopLossDistance, 100000); // Cap at 100k units
  }
}
