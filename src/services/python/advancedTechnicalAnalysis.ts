
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
    def vwap(high: List[float], low: List[float], close: List[float], volume: List[float]) -> List[float]:
        """Volume Weighted Average Price"""
        result = []
        cum_volume = 0
        cum_price_volume = 0
        
        for i in range(len(close)):
            typical_price = (high[i] + low[i] + close[i]) / 3
            price_volume = typical_price * volume[i]
            
            cum_volume += volume[i]
            cum_price_volume += price_volume
            
            if cum_volume > 0:
                vwap = cum_price_volume / cum_volume
                result.append(vwap)
            else:
                result.append(float('nan'))
        
        return result
    
    @staticmethod
    def on_balance_volume(close: List[float], volume: List[float]) -> List[float]:
        """On-Balance Volume"""
        result = [volume[0] if volume else 0]
        
        for i in range(1, len(close)):
            if close[i] > close[i-1]:
                obv = result[i-1] + volume[i]
            elif close[i] < close[i-1]:
                obv = result[i-1] - volume[i]
            else:
                obv = result[i-1]
            result.append(obv)
        
        return result
    
    @staticmethod
    def adx(high: List[float], low: List[float], close: List[float], period: int = 14) -> Dict[str, List[float]]:
        """Average Directional Index"""
        atr_values = AdvancedTechnicalAnalysis.atr(high, low, close, period)
        
        plus_di = []
        minus_di = []
        adx_values = []
        
        for i in range(1, len(close)):
            up_move = high[i] - high[i-1] if i > 0 else 0
            down_move = low[i-1] - low[i] if i > 0 else 0
            
            plus_dm = up_move if up_move > down_move and up_move > 0 else 0
            minus_dm = down_move if down_move > up_move and down_move > 0 else 0
            
            if i < period:
                plus_di.append(float('nan'))
                minus_di.append(float('nan'))
                adx_values.append(float('nan'))
            else:
                plus_di_val = (plus_dm / atr_values[i]) * 100 if atr_values[i] > 0 else 0
                minus_di_val = (minus_dm / atr_values[i]) * 100 if atr_values[i] > 0 else 0
                
                plus_di.append(plus_di_val)
                minus_di.append(minus_di_val)
                
                dx = abs(plus_di_val - minus_di_val) / (plus_di_val + minus_di_val) * 100 if (plus_di_val + minus_di_val) > 0 else 0
                adx_values.append(dx)
        
        # Pad to match original length
        plus_di = [float('nan')] + plus_di
        minus_di = [float('nan')] + minus_di
        adx_values = [float('nan')] + adx_values
        
        return {'adx': adx_values, 'plus_di': plus_di, 'minus_di': minus_di}
    
    @staticmethod
    def donchian_channels(high: List[float], low: List[float], period: int = 20) -> Dict[str, List[float]]:
        """Donchian Channels"""
        upper = []
        lower = []
        middle = []
        
        for i in range(len(high)):
            if i < period - 1:
                upper.append(float('nan'))
                lower.append(float('nan'))
                middle.append(float('nan'))
            else:
                period_high = max(high[i-period+1:i+1])
                period_low = min(low[i-period+1:i+1])
                period_middle = (period_high + period_low) / 2
                
                upper.append(period_high)
                lower.append(period_low)
                middle.append(period_middle)
        
        return {'upper': upper, 'lower': lower, 'middle': middle}
    
    @staticmethod
    def keltner_channels(high: List[float], low: List[float], close: List[float], period: int = 20, multiplier: float = 2.0) -> Dict[str, List[float]]:
        """Keltner Channels"""
        ema = TechnicalAnalysis.ema(close, period)
        atr_values = AdvancedTechnicalAnalysis.atr(high, low, close, period)
        
        upper = []
        lower = []
        
        for i in range(len(close)):
            if math.isnan(ema[i]) or math.isnan(atr_values[i]):
                upper.append(float('nan'))
                lower.append(float('nan'))
            else:
                upper.append(ema[i] + (multiplier * atr_values[i]))
                lower.append(ema[i] - (multiplier * atr_values[i]))
        
        return {'upper': upper, 'middle': ema, 'lower': lower}
    
    @staticmethod
    def fibonacci_retracements(high_price: float, low_price: float) -> Dict[str, float]:
        """Fibonacci Retracement Levels"""
        diff = high_price - low_price
        
        return {
            '0.0': high_price,
            '23.6': high_price - (diff * 0.236),
            '38.2': high_price - (diff * 0.382),
            '50.0': high_price - (diff * 0.500),
            '61.8': high_price - (diff * 0.618),
            '78.6': high_price - (diff * 0.786),
            '100.0': low_price
        }
    
    @staticmethod
    def tema(close: List[float], period: int) -> List[float]:
        """Triple Exponential Moving Average"""
        ema1 = TechnicalAnalysis.ema(close, period)
        ema2 = TechnicalAnalysis.ema([x for x in ema1 if not math.isnan(x)], period)
        
        # Pad ema2 to match ema1 length
        ema2_padded = [float('nan')] * (len(ema1) - len(ema2)) + ema2
        
        ema3 = TechnicalAnalysis.ema([x for x in ema2_padded if not math.isnan(x)], period)
        
        # Pad ema3 to match original length
        ema3_padded = [float('nan')] * (len(ema1) - len(ema3)) + ema3
        
        tema_values = []
        for i in range(len(ema1)):
            if math.isnan(ema1[i]) or math.isnan(ema2_padded[i]) or math.isnan(ema3_padded[i]):
                tema_values.append(float('nan'))
            else:
                tema = 3 * ema1[i] - 3 * ema2_padded[i] + ema3_padded[i]
                tema_values.append(tema)
        
        return tema_values
    
    @staticmethod
    def hull_ma(close: List[float], period: int) -> List[float]:
        """Hull Moving Average"""
        half_period = int(period / 2)
        sqrt_period = int(math.sqrt(period))
        
        wma_half = TechnicalAnalysis.wma(close, half_period)
        wma_full = TechnicalAnalysis.wma(close, period)
        
        # Calculate 2 * WMA(n/2) - WMA(n)
        raw_hull = []
        for i in range(len(close)):
            if math.isnan(wma_half[i]) or math.isnan(wma_full[i]):
                raw_hull.append(float('nan'))
            else:
                raw_hull.append(2 * wma_half[i] - wma_full[i])
        
        # Apply WMA with sqrt(period) to the result
        hull_ma = TechnicalAnalysis.wma([x for x in raw_hull if not math.isnan(x)], sqrt_period)
        
        # Pad to match original length
        hull_ma_padded = [float('nan')] * (len(raw_hull) - len(hull_ma)) + hull_ma
        
        return hull_ma_padded
    
    @staticmethod
    def supertrend(high: List[float], low: List[float], close: List[float], period: int = 10, multiplier: float = 3.0) -> Dict[str, List[float]]:
        """SuperTrend Indicator"""
        atr_values = AdvancedTechnicalAnalysis.atr(high, low, close, period)
        
        basic_upper = []
        basic_lower = []
        final_upper = []
        final_lower = []
        supertrend = []
        trend = []
        
        for i in range(len(close)):
            if math.isnan(atr_values[i]):
                basic_upper.append(float('nan'))
                basic_lower.append(float('nan'))
                final_upper.append(float('nan'))
                final_lower.append(float('nan'))
                supertrend.append(float('nan'))
                trend.append(1)
            else:
                hl2 = (high[i] + low[i]) / 2
                
                basic_ub = hl2 + (multiplier * atr_values[i])
                basic_lb = hl2 - (multiplier * atr_values[i])
                
                basic_upper.append(basic_ub)
                basic_lower.append(basic_lb)
                
                # Final upper band
                if i == 0 or math.isnan(final_upper[i-1]):
                    final_ub = basic_ub
                else:
                    final_ub = basic_ub if basic_ub < final_upper[i-1] or close[i-1] > final_upper[i-1] else final_upper[i-1]
                
                # Final lower band
                if i == 0 or math.isnan(final_lower[i-1]):
                    final_lb = basic_lb
                else:
                    final_lb = basic_lb if basic_lb > final_lower[i-1] or close[i-1] < final_lower[i-1] else final_lower[i-1]
                
                final_upper.append(final_ub)
                final_lower.append(final_lb)
                
                # SuperTrend
                if i == 0:
                    st = final_ub
                    t = 1
                else:
                    prev_st = supertrend[i-1]
                    if prev_st == final_upper[i-1] and close[i] < final_ub:
                        st = final_ub
                        t = 1
                    elif prev_st == final_upper[i-1] and close[i] >= final_ub:
                        st = final_lb
                        t = -1
                    elif prev_st == final_lower[i-1] and close[i] > final_lb:
                        st = final_lb
                        t = -1
                    else:
                        st = final_ub
                        t = 1
                
                supertrend.append(st)
                trend.append(t)
        
        return {'supertrend': supertrend, 'trend': trend}
    
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

# Additional helper for Hull MA
class TechnicalAnalysis:
    @staticmethod
    def wma(data: List[float], period: int) -> List[float]:
        """Weighted Moving Average"""
        result = []
        weights = list(range(1, period + 1))
        weight_sum = sum(weights)
        
        for i in range(len(data)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                weighted_sum = sum(data[i-period+1+j] * weights[j] for j in range(period))
                wma_val = weighted_sum / weight_sum
                result.append(wma_val)
        
        return result
    
    @staticmethod
    def ema(data: List[float], period: int) -> List[float]:
        """Exponential Moving Average"""
        if not data:
            return []
        
        result = [data[0]]
        multiplier = 2 / (period + 1)
        
        for i in range(1, len(data)):
            ema_val = (data[i] * multiplier) + (result[i-1] * (1 - multiplier))
            result.append(ema_val)
        
        return result
`;
