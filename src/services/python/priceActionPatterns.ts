
export const PRICE_ACTION_PATTERNS_PYTHON_CODE = `
import pandas as pd
import numpy as np
import math
from typing import Dict, List, Any, Tuple

class PriceActionPatterns:
    @staticmethod
    def pin_bar(open_prices: List[float], high: List[float], low: List[float], 
               close: List[float], min_body_ratio: float = 0.3) -> List[Dict[str, Any]]:
        """Detect Pin Bar (Hammer/Shooting Star) patterns"""
        patterns = []
        
        for i in range(len(close)):
            body_size = abs(close[i] - open_prices[i])
            total_range = high[i] - low[i]
            
            if total_range == 0:
                patterns.append({'type': 'none', 'strength': 0})
                continue
            
            upper_shadow = high[i] - max(open_prices[i], close[i])
            lower_shadow = min(open_prices[i], close[i]) - low[i]
            
            body_ratio = body_size / total_range
            upper_shadow_ratio = upper_shadow / total_range
            lower_shadow_ratio = lower_shadow / total_range
            
            # Bullish Pin Bar (Hammer)
            if (lower_shadow_ratio > 0.6 and body_ratio < min_body_ratio and 
                upper_shadow_ratio < 0.1):
                strength = min(100, int(lower_shadow_ratio * 100))
                patterns.append({'type': 'bullish_pin', 'strength': strength})
            
            # Bearish Pin Bar (Shooting Star)
            elif (upper_shadow_ratio > 0.6 and body_ratio < min_body_ratio and 
                  lower_shadow_ratio < 0.1):
                strength = min(100, int(upper_shadow_ratio * 100))
                patterns.append({'type': 'bearish_pin', 'strength': strength})
            
            else:
                patterns.append({'type': 'none', 'strength': 0})
        
        return patterns
    
    @staticmethod
    def engulfing_pattern(open_prices: List[float], high: List[float], low: List[float], 
                         close: List[float]) -> List[Dict[str, Any]]:
        """Detect Bullish and Bearish Engulfing patterns"""
        patterns = []
        
        for i in range(len(close)):
            if i == 0:
                patterns.append({'type': 'none', 'strength': 0})
                continue
            
            # Current candle
            curr_body_top = max(open_prices[i], close[i])
            curr_body_bottom = min(open_prices[i], close[i])
            curr_is_bullish = close[i] > open_prices[i]
            
            # Previous candle
            prev_body_top = max(open_prices[i-1], close[i-1])
            prev_body_bottom = min(open_prices[i-1], close[i-1])
            prev_is_bullish = close[i-1] > open_prices[i-1]
            
            # Bullish Engulfing
            if (curr_is_bullish and not prev_is_bullish and
                curr_body_bottom < prev_body_bottom and curr_body_top > prev_body_top):
                
                engulf_ratio = (curr_body_top - curr_body_bottom) / (prev_body_top - prev_body_bottom)
                strength = min(100, int(engulf_ratio * 50))
                patterns.append({'type': 'bullish_engulfing', 'strength': strength})
            
            # Bearish Engulfing
            elif (not curr_is_bullish and prev_is_bullish and
                  curr_body_bottom < prev_body_bottom and curr_body_top > prev_body_top):
                
                engulf_ratio = (curr_body_top - curr_body_bottom) / (prev_body_top - prev_body_bottom)
                strength = min(100, int(engulf_ratio * 50))
                patterns.append({'type': 'bearish_engulfing', 'strength': strength})
            
            else:
                patterns.append({'type': 'none', 'strength': 0})
        
        return patterns
    
    @staticmethod
    def doji_patterns(open_prices: List[float], high: List[float], low: List[float], 
                     close: List[float], doji_threshold: float = 0.1) -> List[Dict[str, Any]]:
        """Detect Doji, Dragonfly, and Gravestone patterns"""
        patterns = []
        
        for i in range(len(close)):
            body_size = abs(close[i] - open_prices[i])
            total_range = high[i] - low[i]
            
            if total_range == 0:
                patterns.append({'type': 'none', 'strength': 0})
                continue
            
            body_ratio = body_size / total_range
            upper_shadow = high[i] - max(open_prices[i], close[i])
            lower_shadow = min(open_prices[i], close[i]) - low[i]
            
            upper_shadow_ratio = upper_shadow / total_range
            lower_shadow_ratio = lower_shadow / total_range
            
            if body_ratio <= doji_threshold:
                # Dragonfly Doji
                if lower_shadow_ratio > 0.6 and upper_shadow_ratio < 0.1:
                    strength = int(lower_shadow_ratio * 100)
                    patterns.append({'type': 'dragonfly_doji', 'strength': strength})
                
                # Gravestone Doji
                elif upper_shadow_ratio > 0.6 and lower_shadow_ratio < 0.1:
                    strength = int(upper_shadow_ratio * 100)
                    patterns.append({'type': 'gravestone_doji', 'strength': strength})
                
                # Regular Doji
                else:
                    strength = int((1 - body_ratio) * 50)
                    patterns.append({'type': 'doji', 'strength': strength})
            else:
                patterns.append({'type': 'none', 'strength': 0})
        
        return patterns
    
    @staticmethod
    def morning_evening_star(open_prices: List[float], high: List[float], low: List[float], 
                           close: List[float]) -> List[Dict[str, Any]]:
        """Detect Morning Star and Evening Star patterns"""
        patterns = []
        
        for i in range(len(close)):
            if i < 2:
                patterns.append({'type': 'none', 'strength': 0})
                continue
            
            # Three candles: [i-2], [i-1], [i]
            candles = []
            for j in range(i-2, i+1):
                body_size = abs(close[j] - open_prices[j])
                is_bullish = close[j] > open_prices[j]
                candles.append({
                    'body_size': body_size,
                    'is_bullish': is_bullish,
                    'high': high[j],
                    'low': low[j],
                    'open': open_prices[j],
                    'close': close[j]
                })
            
            # Morning Star Pattern
            if (not candles[0]['is_bullish'] and  # First candle bearish
                candles[1]['body_size'] < candles[0]['body_size'] * 0.5 and  # Small middle candle
                candles[2]['is_bullish'] and  # Third candle bullish
                candles[2]['close'] > (candles[0]['open'] + candles[0]['close']) / 2):  # Recovery
                
                strength = int(min(100, (candles[2]['body_size'] / candles[0]['body_size']) * 50))
                patterns.append({'type': 'morning_star', 'strength': strength})
            
            # Evening Star Pattern
            elif (candles[0]['is_bullish'] and  # First candle bullish
                  candles[1]['body_size'] < candles[0]['body_size'] * 0.5 and  # Small middle candle
                  not candles[2]['is_bullish'] and  # Third candle bearish
                  candles[2]['close'] < (candles[0]['open'] + candles[0]['close']) / 2):  # Decline
                
                strength = int(min(100, (candles[2]['body_size'] / candles[0]['body_size']) * 50))
                patterns.append({'type': 'evening_star', 'strength': strength})
            
            else:
                patterns.append({'type': 'none', 'strength': 0})
        
        return patterns
    
    @staticmethod
    def inside_outside_bars(open_prices: List[float], high: List[float], low: List[float], 
                           close: List[float]) -> List[Dict[str, Any]]:
        """Detect Inside Bar and Outside Bar patterns"""
        patterns = []
        
        for i in range(len(close)):
            if i == 0:
                patterns.append({'type': 'none', 'strength': 0})
                continue
            
            curr_range = high[i] - low[i]
            prev_range = high[i-1] - low[i-1]
            
            # Inside Bar
            if high[i] <= high[i-1] and low[i] >= low[i-1]:
                compression_ratio = 1 - (curr_range / prev_range) if prev_range > 0 else 0
                strength = int(compression_ratio * 100)
                patterns.append({'type': 'inside_bar', 'strength': strength})
            
            # Outside Bar
            elif high[i] > high[i-1] and low[i] < low[i-1]:
                expansion_ratio = (curr_range / prev_range) - 1 if prev_range > 0 else 0
                strength = int(min(100, expansion_ratio * 100))
                patterns.append({'type': 'outside_bar', 'strength': strength})
            
            else:
                patterns.append({'type': 'none', 'strength': 0})
        
        return patterns
    
    @staticmethod
    def chart_patterns_simple(high: List[float], low: List[float], close: List[float], 
                             lookback: int = 20) -> Dict[str, List[Any]]:
        """Simplified chart pattern detection for Double Top/Bottom"""
        double_tops = []
        double_bottoms = []
        
        for i in range(lookback, len(close) - lookback):
            # Look for potential double top
            if i >= lookback * 2:
                recent_highs = []
                for j in range(i - lookback * 2, i):
                    if high[j] == max(high[max(0, j-5):j+6]):  # Local high
                        recent_highs.append((j, high[j]))
                
                if len(recent_highs) >= 2:
                    # Check if two highs are similar
                    last_two = sorted(recent_highs, key=lambda x: x[1], reverse=True)[:2]
                    if abs(last_two[0][1] - last_two[1][1]) / last_two[0][1] < 0.02:  # Within 2%
                        double_tops.append({
                            'indices': [last_two[0][0], last_two[1][0]],
                            'levels': [last_two[0][1], last_two[1][1]],
                            'current_index': i
                        })
            
            # Look for potential double bottom
            if i >= lookback * 2:
                recent_lows = []
                for j in range(i - lookback * 2, i):
                    if low[j] == min(low[max(0, j-5):j+6]):  # Local low
                        recent_lows.append((j, low[j]))
                
                if len(recent_lows) >= 2:
                    # Check if two lows are similar
                    last_two = sorted(recent_lows, key=lambda x: x[1])[:2]
                    if abs(last_two[0][1] - last_two[1][1]) / last_two[0][1] < 0.02:  # Within 2%
                        double_bottoms.append({
                            'indices': [last_two[0][0], last_two[1][0]],
                            'levels': [last_two[0][1], last_two[1][1]],
                            'current_index': i
                        })
        
        return {
            'double_tops': double_tops,
            'double_bottoms': double_bottoms
        }
`;
