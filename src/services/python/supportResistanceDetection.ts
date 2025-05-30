
export const SUPPORT_RESISTANCE_PYTHON_CODE = `
import pandas as pd
import numpy as np
import math
from typing import Dict, List, Any, Tuple

class SupportResistanceDetection:
    @staticmethod
    def pivot_points_standard(high: float, low: float, close: float) -> Dict[str, float]:
        """Standard Pivot Points calculation"""
        pivot = (high + low + close) / 3
        
        return {
            'pivot': pivot,
            'resistance1': (2 * pivot) - low,
            'support1': (2 * pivot) - high,
            'resistance2': pivot + (high - low),
            'support2': pivot - (high - low),
            'resistance3': high + 2 * (pivot - low),
            'support3': low - 2 * (high - pivot)
        }
    
    @staticmethod
    def pivot_points_fibonacci(high: float, low: float, close: float) -> Dict[str, float]:
        """Fibonacci Pivot Points calculation"""
        pivot = (high + low + close) / 3
        diff = high - low
        
        return {
            'pivot': pivot,
            'resistance1': pivot + (diff * 0.382),
            'support1': pivot - (diff * 0.382),
            'resistance2': pivot + (diff * 0.618),
            'support2': pivot - (diff * 0.618),
            'resistance3': pivot + diff,
            'support3': pivot - diff
        }
    
    @staticmethod
    def pivot_points_camarilla(high: float, low: float, close: float) -> Dict[str, float]:
        """Camarilla Pivot Points calculation"""
        diff = high - low
        
        return {
            'pivot': close,
            'resistance1': close + (diff * 1.1 / 12),
            'support1': close - (diff * 1.1 / 12),
            'resistance2': close + (diff * 1.1 / 6),
            'support2': close - (diff * 1.1 / 6),
            'resistance3': close + (diff * 1.1 / 4),
            'support3': close - (diff * 1.1 / 4),
            'resistance4': close + (diff * 1.1 / 2),
            'support4': close - (diff * 1.1 / 2)
        }
    
    @staticmethod
    def fractal_levels(high: List[float], low: List[float], lookback: int = 5) -> Dict[str, List[float]]:
        """Detect fractal swing highs and lows"""
        fractal_highs = []
        fractal_lows = []
        
        for i in range(len(high)):
            if i < lookback or i >= len(high) - lookback:
                fractal_highs.append(float('nan'))
                fractal_lows.append(float('nan'))
                continue
            
            # Check for fractal high
            is_fractal_high = True
            for j in range(i - lookback, i + lookback + 1):
                if j != i and high[j] >= high[i]:
                    is_fractal_high = False
                    break
            
            # Check for fractal low
            is_fractal_low = True
            for j in range(i - lookback, i + lookback + 1):
                if j != i and low[j] <= low[i]:
                    is_fractal_low = False
                    break
            
            fractal_highs.append(high[i] if is_fractal_high else float('nan'))
            fractal_lows.append(low[i] if is_fractal_low else float('nan'))
        
        return {
            'fractal_highs': fractal_highs,
            'fractal_lows': fractal_lows
        }
    
    @staticmethod
    def recent_highs_lows(high: List[float], low: List[float], period: int = 20) -> Dict[str, List[float]]:
        """Mark recent highs and lows"""
        recent_highs = []
        recent_lows = []
        
        for i in range(len(high)):
            if i < period - 1:
                recent_highs.append(float('nan'))
                recent_lows.append(float('nan'))
            else:
                period_high = max(high[i-period+1:i+1])
                period_low = min(low[i-period+1:i+1])
                
                recent_highs.append(period_high)
                recent_lows.append(period_low)
        
        return {
            'recent_highs': recent_highs,
            'recent_lows': recent_lows
        }
    
    @staticmethod
    def supply_demand_zones(high: List[float], low: List[float], close: List[float], 
                           volume: List[float], zone_strength: int = 2) -> Dict[str, List[Any]]:
        """Identify supply and demand zones based on price reaction and volume"""
        supply_zones = []
        demand_zones = []
        
        # Use fractal levels as base for zones
        fractals = SupportResistanceDetection.fractal_levels(high, low, 3)
        
        for i in range(len(close)):
            if not math.isnan(fractals['fractal_highs'][i]):
                # Potential supply zone
                zone_high = fractals['fractal_highs'][i]
                zone_low = zone_high * 0.995  # 0.5% zone width
                
                # Check for volume confirmation
                vol_avg = sum(volume[max(0, i-10):i+1]) / min(11, i+1)
                if volume[i] > vol_avg * 1.2:  # Above average volume
                    supply_zones.append({
                        'start_index': i,
                        'high': zone_high,
                        'low': zone_low,
                        'strength': zone_strength,
                        'type': 'supply'
                    })
            
            if not math.isnan(fractals['fractal_lows'][i]):
                # Potential demand zone
                zone_low = fractals['fractal_lows'][i]
                zone_high = zone_low * 1.005  # 0.5% zone width
                
                # Check for volume confirmation
                vol_avg = sum(volume[max(0, i-10):i+1]) / min(11, i+1)
                if volume[i] > vol_avg * 1.2:  # Above average volume
                    demand_zones.append({
                        'start_index': i,
                        'high': zone_high,
                        'low': zone_low,
                        'strength': zone_strength,
                        'type': 'demand'
                    })
        
        return {
            'supply_zones': supply_zones,
            'demand_zones': demand_zones
        }
    
    @staticmethod
    def volume_profile_levels(close: List[float], volume: List[float], bins: int = 20) -> Dict[str, Any]:
        """Simplified volume profile - identify high volume price levels"""
        if not close or not volume:
            return {'levels': [], 'poc': float('nan')}
        
        min_price = min(close)
        max_price = max(close)
        price_range = max_price - min_price
        
        if price_range == 0:
            return {'levels': [], 'poc': close[0]}
        
        bin_size = price_range / bins
        volume_by_price = {}
        
        # Accumulate volume by price bins
        for i in range(len(close)):
            price_bin = int((close[i] - min_price) / bin_size)
            price_bin = min(price_bin, bins - 1)  # Ensure within bounds
            
            bin_price = min_price + (price_bin * bin_size) + (bin_size / 2)
            
            if bin_price not in volume_by_price:
                volume_by_price[bin_price] = 0
            volume_by_price[bin_price] += volume[i]
        
        # Find Point of Control (highest volume level)
        poc_price = max(volume_by_price.keys(), key=lambda k: volume_by_price[k])
        
        # Sort levels by volume
        levels = sorted(volume_by_price.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'levels': levels,
            'poc': poc_price,
            'volume_by_price': volume_by_price
        }
    
    @staticmethod
    def support_resistance_strength(high: List[float], low: List[float], close: List[float], 
                                  level: float, tolerance: float = 0.001) -> int:
        """Calculate strength of a support/resistance level based on touches"""
        touches = 0
        
        for i in range(len(close)):
            # Check if price touched the level within tolerance
            price_high = high[i]
            price_low = low[i]
            
            level_high = level * (1 + tolerance)
            level_low = level * (1 - tolerance)
            
            # Count as touch if price range intersects with level zone
            if price_low <= level_high and price_high >= level_low:
                touches += 1
        
        return touches
`;
