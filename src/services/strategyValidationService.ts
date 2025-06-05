
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
    
    // Check for proper return structure guidance
    const hasEntryType = code.includes('entry_type') || code.includes('trade_direction');
    if (!hasEntryType) {
      warnings.push("Strategy should return 'entry_type' array with BUY/SELL signals for forward testing");
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
    
    const { entry, exit, entry_type, trade_direction } = result;
    const direction_array = entry_type || trade_direction;
    
    // Validate required arrays
    if (!Array.isArray(entry)) {
      errors.push("Strategy must return 'entry' array");
    }
    
    if (!Array.isArray(exit)) {
      errors.push("Strategy must return 'exit' array");
    }
    
    if (!Array.isArray(direction_array)) {
      errors.push("Strategy must return 'entry_type' or 'trade_direction' array");
    }
    
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings,
        signalStats: { totalEntries: 0, buySignals: 0, sellSignals: 0 }
      };
    }
    
    // Validate array lengths
    if (entry.length !== exit.length || entry.length !== direction_array.length) {
      errors.push(`Array lengths must match: entry(${entry.length}), exit(${exit.length}), entry_type(${direction_array.length})`);
    }
    
    // Validate direction values
    const validDirections = ['BUY', 'SELL', 'NONE', null, undefined];
    const invalidDirections = direction_array.filter((d: any) => !validDirections.includes(d));
    
    if (invalidDirections.length > 0) {
      errors.push(`Invalid direction values: ${[...new Set(invalidDirections)].join(', ')}. Must be 'BUY', 'SELL', or 'NONE'`);
    }
    
    // Calculate signal statistics
    const buySignals = direction_array.filter((d: string, i: number) => entry[i] && d === 'BUY').length;
    const sellSignals = direction_array.filter((d: string, i: number) => entry[i] && d === 'SELL').length;
    const totalEntries = entry.filter(Boolean).length;
    
    if (buySignals === 0 && sellSignals === 0) {
      warnings.push("Strategy generates no BUY or SELL signals - check entry conditions");
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
    return `# Enhanced Strategy Template with Required Directional Signals
def strategy_logic(data):
    """
    REQUIRED: Your strategy MUST return these arrays:
    - entry: [True/False] - when to enter trades
    - exit: [True/False] - when to exit trades  
    - entry_type: ["BUY"/"SELL"/"NONE"] - REQUIRED for forward testing
    """
    
    close = data['Close'].tolist()
    
    # Your technical analysis here
    sma_fast = TechnicalAnalysis.sma(close, 10)
    sma_slow = TechnicalAnalysis.sma(close, 20)
    
    entry = []
    exit = []
    entry_type = []  # REQUIRED: Must specify BUY or SELL
    
    for i in range(len(close)):
        if i < 20:  # Not enough data
            entry.append(False)
            exit.append(False)
            entry_type.append('NONE')
        else:
            # Entry conditions
            bullish_cross = sma_fast[i] > sma_slow[i] and sma_fast[i-1] <= sma_slow[i-1]
            bearish_cross = sma_fast[i] < sma_slow[i] and sma_fast[i-1] >= sma_slow[i-1]
            
            if bullish_cross:
                entry.append(True)
                entry_type.append('BUY')  # REQUIRED: Specify direction
            elif bearish_cross:
                entry.append(True)
                entry_type.append('SELL')  # REQUIRED: Specify direction
            else:
                entry.append(False)
                entry_type.append('NONE')
            
            # Exit conditions
            exit.append(False)  # Add your exit logic
    
    # REQUIRED: Must return these three arrays
    return {
        'entry': entry,
        'exit': exit,
        'entry_type': entry_type,  # CRITICAL for forward testing
        'sma_fast': sma_fast,
        'sma_slow': sma_slow
    }`;
  }
}
