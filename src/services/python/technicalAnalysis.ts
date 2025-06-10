
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

class AdvancedTechnicalAnalysis:
    """Advanced Technical Analysis indicators"""
    
    @staticmethod
    def atr(high, low, close, period=14):
        """Calculate Average True Range - wrapper for compatibility"""
        return TechnicalAnalysis.atr(high, low, close, period)
    
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
                std = (sum([(x - sma[i])**2 for x in subset]) / period) ** 0.5
                upper_band.append(sma[i] + (std_dev * std))
                lower_band.append(sma[i] - (std_dev * std))
        
        return {
            'upper': upper_band,
            'middle': sma,
            'lower': lower_band
        }
`;
