
import { ADVANCED_TECHNICAL_ANALYSIS_PYTHON_CODE } from './advancedTechnicalAnalysis';

export const TECHNICAL_ANALYSIS_PYTHON_CODE = `
import pandas as pd
import numpy as np
from typing import Dict, List, Any
import json
import math

class TechnicalAnalysis:
    @staticmethod
    def sma(data: List[float], period: int) -> List[float]:
        """Simple Moving Average"""
        result = []
        for i in range(len(data)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                avg = sum(data[i-period+1:i+1]) / period
                result.append(avg)
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
    
    @staticmethod
    def rsi(data: List[float], period: int = 14) -> List[float]:
        """Relative Strength Index"""
        if len(data) < period + 1:
            return [float('nan')] * len(data)
        
        gains = []
        losses = []
        
        for i in range(1, len(data)):
            change = data[i] - data[i-1]
            gains.append(max(change, 0))
            losses.append(max(-change, 0))
        
        result = [float('nan')]
        
        for i in range(len(gains)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                avg_gain = sum(gains[i-period+1:i+1]) / period
                avg_loss = sum(losses[i-period+1:i+1]) / period
                
                if avg_loss == 0:
                    result.append(100)
                else:
                    rs = avg_gain / avg_loss
                    rsi_val = 100 - (100 / (1 + rs))
                    result.append(rsi_val)
        
        return result

    @staticmethod
    def stddev(data: List[float], period: int) -> List[float]:
        """Standard Deviation"""
        result = []
        for i in range(len(data)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                slice_data = data[i-period+1:i+1]
                mean = sum(slice_data) / len(slice_data)
                variance = sum((x - mean) ** 2 for x in slice_data) / len(slice_data)
                result.append(math.sqrt(variance))
        return result
    
    @staticmethod
    def bollinger_bands(data: List[float], period: int = 20, std_dev: float = 2):
        """Bollinger Bands"""
        sma = TechnicalAnalysis.sma(data, period)
        std = TechnicalAnalysis.stddev(data, period)
        
        upper = []
        lower = []
        
        for i in range(len(data)):
            if math.isnan(sma[i]) or math.isnan(std[i]):
                upper.append(float('nan'))
                lower.append(float('nan'))
            else:
                upper.append(sma[i] + (std[i] * std_dev))
                lower.append(sma[i] - (std[i] * std_dev))
        
        return {
            'upper': upper,
            'middle': sma,
            'lower': lower
        }
    
    @staticmethod
    def macd(data: List[float], fast: int = 12, slow: int = 26, signal: int = 9):
        """MACD Indicator"""
        ema_fast = TechnicalAnalysis.ema(data, fast)
        ema_slow = TechnicalAnalysis.ema(data, slow)
        
        macd_line = []
        for i in range(len(data)):
            macd_line.append(ema_fast[i] - ema_slow[i])
        
        # Remove NaN values for signal calculation
        valid_macd = [x for x in macd_line if not math.isnan(x)]
        signal_line = TechnicalAnalysis.ema(valid_macd, signal)
        
        # Pad signal line to match original length
        padded_signal = [float('nan')] * (len(macd_line) - len(signal_line)) + signal_line
        
        histogram = []
        for i in range(len(macd_line)):
            if math.isnan(macd_line[i]) or math.isnan(padded_signal[i]):
                histogram.append(float('nan'))
            else:
                histogram.append(macd_line[i] - padded_signal[i])
        
        return {
            'macd': macd_line,
            'signal': padded_signal,
            'histogram': histogram
        }
    
    @staticmethod
    def stochastic(high: List[float], low: List[float], close: List[float], k_period: int = 14, d_period: int = 3):
        """Stochastic Oscillator"""
        k_percent = []
        
        for i in range(len(close)):
            if i < k_period - 1:
                k_percent.append(float('nan'))
            else:
                period_high = max(high[i-k_period+1:i+1])
                period_low = min(low[i-k_period+1:i+1])
                
                if period_high == period_low:
                    k_percent.append(50)
                else:
                    k_val = ((close[i] - period_low) / (period_high - period_low)) * 100
                    k_percent.append(k_val)
        
        # Calculate %D (SMA of %K)
        d_percent = TechnicalAnalysis.sma([x for x in k_percent if not math.isnan(x)], d_period)
        padded_d = [float('nan')] * (len(k_percent) - len(d_percent)) + d_percent
        
        return {
            'k': k_percent,
            'd': padded_d
        }

# Include advanced indicators
${ADVANCED_TECHNICAL_ANALYSIS_PYTHON_CODE}
`;
