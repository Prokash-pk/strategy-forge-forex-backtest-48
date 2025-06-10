
export interface StrategyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  signalStats: {
    totalEntries: number;
    buySignals: number;
    sellSignals: number;
  };
}

export class StrategyValidationService {
  static validateStrategyCode(code: string): StrategyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for required function
    if (!code.includes('def strategy_logic(')) {
      errors.push("Strategy must contain a 'strategy_logic' function");
    }
    
    // Check for proper return structure - be more flexible about direction
    const hasDirection = code.includes('direction') && (code.includes('BUY') || code.includes('SELL'));
    const hasEntryType = code.includes('entry_type') || code.includes('trade_direction');
    
    if (!hasDirection && !hasEntryType) {
      warnings.push("Strategy will auto-generate BUY/SELL directions from entry conditions and market context");
    }
    
    // Check for basic signal arrays
    if (!code.includes('entry') || !code.includes('exit')) {
      errors.push("Strategy must return 'entry' and 'exit' signal arrays");
    }
    
    // Check for proper return statement
    if (!code.includes('return {')) {
      errors.push("Strategy must return a dictionary with signal arrays");
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      signalStats: {
        totalEntries: 0,
        buySignals: 0,
        sellSignals: 0
      }
    };
  }
  
  static validateStrategyResult(result: any): StrategyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!result || typeof result !== 'object') {
      errors.push("Strategy must return a valid object");
      return {
        isValid: false,
        errors,
        warnings,
        signalStats: { totalEntries: 0, buySignals: 0, sellSignals: 0 }
      };
    }
    
    const { entry, exit, direction, entry_type, trade_direction } = result;
    // Check for 'direction' first, then fallbacks, then auto-generate
    const direction_array = direction || entry_type || trade_direction;
    
    // Validate required arrays
    if (!Array.isArray(entry)) {
      errors.push("Strategy must return 'entry' array");
    }
    
    if (!Array.isArray(exit)) {
      errors.push("Strategy must return 'exit' array");
    }
    
    // Be more flexible about direction array - allow auto-generation
    if (!Array.isArray(direction_array)) {
      warnings.push("Direction array will be auto-generated from strategy conditions");
    }
    
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings,
        signalStats: { totalEntries: 0, buySignals: 0, sellSignals: 0 }
      };
    }
    
    // Validate array lengths if direction exists
    if (direction_array && entry.length !== exit.length || (direction_array && entry.length !== direction_array.length)) {
      errors.push(`Array lengths must match: entry(${entry.length}), exit(${exit.length}), direction(${direction_array?.length || 'auto-generated'})`);
    }
    
    // Validate direction values if they exist
    if (direction_array) {
      const validDirections = ['BUY', 'SELL', 'NONE', null, undefined];
      const invalidDirections = direction_array.filter((d: any) => !validDirections.includes(d));
      
      if (invalidDirections.length > 0) {
        errors.push(`Invalid direction values: ${[...new Set(invalidDirections)].join(', ')}. Must be 'BUY', 'SELL', or null`);
      }
    }
    
    // Calculate signal statistics
    const totalEntries = entry.filter(Boolean).length;
    let buySignals = 0;
    let sellSignals = 0;
    
    if (direction_array) {
      buySignals = direction_array.filter((d: string, i: number) => entry[i] && d === 'BUY').length;
      sellSignals = direction_array.filter((d: string, i: number) => entry[i] && d === 'SELL').length;
    } else {
      // If no direction array, assume signals will be auto-generated
      warnings.push("BUY/SELL signals will be auto-detected from strategy indicators");
    }
    
    if (totalEntries === 0) {
      warnings.push("Strategy generates no entry signals - check entry conditions");
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      signalStats: {
        totalEntries,
        buySignals,
        sellSignals
      }
    };
  }
  
  static getStrategyTemplate(): string {
    return `# Enhanced Strategy Template with Auto-Detected Directional Signals
def strategy_logic(data, reverse_signals=False):
    """
    REQUIRED: Your strategy MUST return these arrays:
    - entry: [True/False] - when to enter trades
    - exit: [True/False] - when to exit trades  
    - direction: ["BUY"/"SELL"/None] - OPTIONAL (will auto-generate if missing)
    """
    
    close = data['Close'].tolist()
    
    # Your technical analysis here
    sma_fast = TechnicalAnalysis.sma(close, 10)
    sma_slow = TechnicalAnalysis.sma(close, 20)
    
    entry = []
    exit = []
    direction = []  # OPTIONAL: System will auto-detect if missing
    
    for i in range(len(close)):
        if i < 20:  # Not enough data
            entry.append(False)
            exit.append(False)
            direction.append(None)
        else:
            # Entry conditions
            bullish_cross = sma_fast[i] > sma_slow[i] and sma_fast[i-1] <= sma_slow[i-1]
            bearish_cross = sma_fast[i] < sma_slow[i] and sma_fast[i-1] >= sma_slow[i-1]
            
            if bullish_cross:
                entry.append(True)
                direction.append('BUY')  # OPTIONAL: Will auto-detect from indicators
            elif bearish_cross:
                entry.append(True)
                direction.append('SELL')  # OPTIONAL: Will auto-detect from indicators
            else:
                entry.append(False)
                direction.append(None)
            
            # Exit conditions
            exit.append(False)  # Add your exit logic
    
    # REQUIRED: Must return entry and exit arrays
    # OPTIONAL: direction array (will auto-generate if missing)
    return {
        'entry': entry,
        'exit': exit,
        'direction': direction,  # OPTIONAL for auto trading
        'sma_fast': sma_fast,
        'sma_slow': sma_slow
    }`;
  }
}
