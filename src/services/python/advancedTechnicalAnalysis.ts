
export const ADVANCED_TECHNICAL_ANALYSIS_PYTHON_CODE = `
import pandas as pd
import numpy as np
import math
from typing import Dict, List, Any

class AdvancedTechnicalAnalysis:
    @staticmethod
    def atr(high: List[float], low: List[float], close: List[float], period: int = 14) -> List[float]:
        """Average True Range"""
        if len(high) < 2 or len(low) < 2 or len(close) < 2:
            return [float('nan')] * len(close)
        
        true_ranges = []
        
        for i in range(1, len(close)):
            tr1 = high[i] - low[i]  # Current high - current low
            tr2 = abs(high[i] - close[i-1])  # Current high - previous close
            tr3 = abs(low[i] - close[i-1])   # Current low - previous close
            true_range = max(tr1, tr2, tr3)
            true_ranges.append(true_range)
        
        # Calculate ATR using simple moving average of true ranges
        atr_values = [float('nan')]  # First value is always NaN
        
        for i in range(len(true_ranges)):
            if i < period - 1:
                atr_values.append(float('nan'))
            else:
                atr = sum(true_ranges[i-period+1:i+1]) / period
                atr_values.append(atr)
        
        return atr_values
    
    @staticmethod
    def williams_r(high: List[float], low: List[float], close: List[float], period: int = 14) -> List[float]:
        """Williams %R"""
        result = []
        
        for i in range(len(close)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                period_high = max(high[i-period+1:i+1])
                period_low = min(low[i-period+1:i+1])
                
                if period_high == period_low:
                    result.append(-50.0)  # Neutral value when no range
                else:
                    wr = ((period_high - close[i]) / (period_high - period_low)) * -100
                    result.append(wr)
        
        return result
    
    @staticmethod
    def stochastic_oscillator(high: List[float], low: List[float], close: List[float], 
                            k_period: int = 14, d_period: int = 3, smooth_k: int = 3) -> Dict[str, List[float]]:
        """Stochastic Oscillator with smoothing"""
        # Calculate raw %K
        raw_k = []
        
        for i in range(len(close)):
            if i < k_period - 1:
                raw_k.append(float('nan'))
            else:
                period_high = max(high[i-k_period+1:i+1])
                period_low = min(low[i-k_period+1:i+1])
                
                if period_high == period_low:
                    raw_k.append(50.0)
                else:
                    k_val = ((close[i] - period_low) / (period_high - period_low)) * 100
                    raw_k.append(k_val)
        
        # Smooth %K
        k_percent = AdvancedTechnicalAnalysis._smooth_values(raw_k, smooth_k)
        
        # Calculate %D (SMA of smoothed %K)
        d_percent = AdvancedTechnicalAnalysis._smooth_values(k_percent, d_period)
        
        return {
            'k': k_percent,
            'd': d_percent
        }
    
    @staticmethod
    def _smooth_values(values: List[float], period: int) -> List[float]:
        """Helper method to smooth values with SMA"""
        result = []
        valid_values = []
        
        for i, val in enumerate(values):
            if not math.isnan(val):
                valid_values.append(val)
            
            if i < period - 1 or len(valid_values) < period:
                result.append(float('nan'))
            else:
                smooth_val = sum(valid_values[-period:]) / period
                result.append(smooth_val)
        
        return result
    
    @staticmethod
    def commodity_channel_index(high: List[float], low: List[float], close: List[float], period: int = 20) -> List[float]:
        """Commodity Channel Index"""
        result = []
        
        # Calculate typical price
        typical_prices = []
        for i in range(len(close)):
            tp = (high[i] + low[i] + close[i]) / 3
            typical_prices.append(tp)
        
        for i in range(len(typical_prices)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                # Simple Moving Average of typical price
                sma_tp = sum(typical_prices[i-period+1:i+1]) / period
                
                # Mean Deviation
                deviations = [abs(tp - sma_tp) for tp in typical_prices[i-period+1:i+1]]
                mean_deviation = sum(deviations) / period
                
                if mean_deviation == 0:
                    result.append(0)
                else:
                    cci = (typical_prices[i] - sma_tp) / (0.015 * mean_deviation)
                    result.append(cci)
        
        return result
    
    @staticmethod
    def parabolic_sar(high: List[float], low: List[float], af_start: float = 0.02, af_increment: float = 0.02, af_max: float = 0.2) -> List[float]:
        """Parabolic SAR"""
        if len(high) < 2:
            return [float('nan')] * len(high)
        
        result = [float('nan')] * len(high)
        
        # Initialize
        is_uptrend = high[1] > high[0]
        af = af_start
        ep = high[1] if is_uptrend else low[1]  # Extreme Point
        sar = low[0] if is_uptrend else high[0]
        
        result[1] = sar
        
        for i in range(2, len(high)):
            # Calculate new SAR
            sar = sar + af * (ep - sar)
            
            if is_uptrend:
                # Uptrend
                if low[i] <= sar:
                    # Trend reversal
                    is_uptrend = False
                    sar = ep
                    ep = low[i]
                    af = af_start
                else:
                    # Continue uptrend
                    if high[i] > ep:
                        ep = high[i]
                        af = min(af + af_increment, af_max)
                    
                    # SAR cannot be above previous two lows
                    sar = min(sar, min(low[i-1], low[i-2]))
            else:
                # Downtrend
                if high[i] >= sar:
                    # Trend reversal
                    is_uptrend = True
                    sar = ep
                    ep = high[i]
                    af = af_start
                else:
                    # Continue downtrend
                    if low[i] < ep:
                        ep = low[i]
                        af = min(af + af_increment, af_max)
                    
                    # SAR cannot be below previous two highs
                    sar = max(sar, max(high[i-1], high[i-2]))
            
            result[i] = sar
        
        return result
`;
