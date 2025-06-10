
export const TECHNICAL_ANALYSIS_PYTHON_CODE = `
import math
import pandas as pd
import numpy as np

class TechnicalAnalysis:
    """Technical Analysis class with static methods for indicators"""
    
    @staticmethod
    def ema(data, period):
        """Calculate Exponential Moving Average"""
        if len(data) < period:
            return [float('nan')] * len(data)
        
        result = []
        multiplier = 2 / (period + 1)
        
        # Initialize with SMA for the first value
        sma = sum(data[:period]) / period
        result.extend([float('nan')] * (period - 1))
        result.append(sma)
        
        # Calculate EMA for remaining values
        for i in range(period, len(data)):
            ema = (data[i] * multiplier) + (result[i-1] * (1 - multiplier))
            result.append(ema)
        
        return result
    
    @staticmethod
    def sma(data, period):
        """Calculate Simple Moving Average"""
        result = []
        for i in range(len(data)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                avg = sum(data[i-period+1:i+1]) / period
                result.append(avg)
        return result
    
    @staticmethod
    def rsi(data, period=14):
        """Calculate Relative Strength Index"""
        if len(data) < period + 1:
            return [float('nan')] * len(data)
        
        deltas = [data[i] - data[i-1] for i in range(1, len(data))]
        gains = [delta if delta > 0 else 0 for delta in deltas]
        losses = [-delta if delta < 0 else 0 for delta in deltas]
        
        # Calculate initial average gain and loss
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period
        
        result = [float('nan')] * (period)
        
        for i in range(period, len(data)):
            if i == period:
                rs = avg_gain / avg_loss if avg_loss != 0 else 100
            else:
                gain = gains[i-1]
                loss = losses[i-1]
                avg_gain = ((avg_gain * (period - 1)) + gain) / period
                avg_loss = ((avg_loss * (period - 1)) + loss) / period
                rs = avg_gain / avg_loss if avg_loss != 0 else 100
            
            rsi = 100 - (100 / (1 + rs))
            result.append(rsi)
        
        return result
    
    @staticmethod
    def atr(high, low, close, period=14):
        """Calculate Average True Range"""
        if len(high) < 2:
            return [float('nan')] * len(high)
        
        tr_values = []
        for i in range(len(high)):
            if i == 0:
                tr = high[i] - low[i]
            else:
                tr1 = high[i] - low[i]
                tr2 = abs(high[i] - close[i-1])
                tr3 = abs(low[i] - close[i-1])
                tr = max(tr1, tr2, tr3)
            tr_values.append(tr)
        
        # Calculate ATR using SMA of TR values
        atr_values = []
        for i in range(len(tr_values)):
            if i < period - 1:
                atr_values.append(float('nan'))
            else:
                atr = sum(tr_values[i-period+1:i+1]) / period
                atr_values.append(atr)
        
        return atr_values
    
    @staticmethod
    def macd(data, fast_period=12, slow_period=26, signal_period=9):
        """Calculate MACD"""
        fast_ema = TechnicalAnalysis.ema(data, fast_period)
        slow_ema = TechnicalAnalysis.ema(data, slow_period)
        
        macd_line = []
        for i in range(len(data)):
            if math.isnan(fast_ema[i]) or math.isnan(slow_ema[i]):
                macd_line.append(float('nan'))
            else:
                macd_line.append(fast_ema[i] - slow_ema[i])
        
        # Filter out NaN values for signal line calculation
        valid_macd = [x for x in macd_line if not math.isnan(x)]
        signal_ema = TechnicalAnalysis.ema(valid_macd, signal_period)
        
        # Pad signal line back to original length
        signal_line = [float('nan')] * (len(macd_line) - len(signal_ema)) + signal_ema
        
        histogram = []
        for i in range(len(macd_line)):
            if math.isnan(macd_line[i]) or math.isnan(signal_line[i]):
                histogram.append(float('nan'))
            else:
                histogram.append(macd_line[i] - signal_line[i])
        
        return {
            'macd': macd_line,
            'signal': signal_line,
            'histogram': histogram
        }
    
    @staticmethod
    def bollinger_bands(data, period=20, std_dev=2):
        """Calculate Bollinger Bands"""
        sma = TechnicalAnalysis.sma(data, period)
        
        upper_band = []
        lower_band = []
        
        for i in range(len(data)):
            if i < period - 1:
                upper_band.append(float('nan'))
                lower_band.append(float('nan'))
            else:
                subset = data[i-period+1:i+1]
                variance = sum([(x - sma[i])**2 for x in subset]) / period
                std = variance ** 0.5
                upper_band.append(sma[i] + (std_dev * std))
                lower_band.append(sma[i] - (std_dev * std))
        
        return {
            'upper': upper_band,
            'middle': sma,
            'lower': lower_band
        }
    
    @staticmethod
    def stochastic(high, low, close, k_period=14, d_period=3):
        """Calculate Stochastic Oscillator"""
        k_values = []
        
        for i in range(len(close)):
            if i < k_period - 1:
                k_values.append(float('nan'))
            else:
                period_high = max(high[i-k_period+1:i+1])
                period_low = min(low[i-k_period+1:i+1])
                
                if period_high == period_low:
                    k_values.append(50)
                else:
                    k = ((close[i] - period_low) / (period_high - period_low)) * 100
                    k_values.append(k)
        
        # Calculate %D as SMA of %K
        d_values = TechnicalAnalysis.sma(k_values, d_period)
        
        return {
            'k': k_values,
            'd': d_values
        }
    
    @staticmethod
    def williams_r(high, low, close, period=14):
        """Calculate Williams %R"""
        result = []
        
        for i in range(len(close)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                period_high = max(high[i-period+1:i+1])
                period_low = min(low[i-period+1:i+1])
                
                if period_high == period_low:
                    result.append(-50)
                else:
                    wr = ((period_high - close[i]) / (period_high - period_low)) * -100
                    result.append(wr)
        
        return result

class AdvancedTechnicalAnalysis:
    """Advanced Technical Analysis indicators"""
    
    @staticmethod
    def atr(high, low, close, period=14):
        """Calculate Average True Range - wrapper for compatibility"""
        return TechnicalAnalysis.atr(high, low, close, period)
    
    @staticmethod
    def bollinger_bands(data, period=20, std_dev=2):
        """Calculate Bollinger Bands"""
        return TechnicalAnalysis.bollinger_bands(data, period, std_dev)
    
    @staticmethod
    def stochastic(high, low, close, k_period=14, d_period=3):
        """Calculate Stochastic Oscillator"""
        return TechnicalAnalysis.stochastic(high, low, close, k_period, d_period)
    
    @staticmethod
    def williams_r(high, low, close, period=14):
        """Calculate Williams %R"""
        return TechnicalAnalysis.williams_r(high, low, close, period)
    
    @staticmethod
    def cci(high, low, close, period=20):
        """Calculate Commodity Channel Index"""
        typical_price = [(h + l + c) / 3 for h, l, c in zip(high, low, close)]
        sma_tp = TechnicalAnalysis.sma(typical_price, period)
        
        result = []
        for i in range(len(typical_price)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                mean_dev = sum([abs(typical_price[j] - sma_tp[i]) for j in range(i-period+1, i+1)]) / period
                if mean_dev == 0:
                    result.append(0)
                else:
                    cci = (typical_price[i] - sma_tp[i]) / (0.015 * mean_dev)
                    result.append(cci)
        
        return result
`;
