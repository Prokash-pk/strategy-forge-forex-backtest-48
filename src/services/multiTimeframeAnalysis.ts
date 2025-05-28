
interface TimeframeData {
  timeframe: string;
  data: {
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
    timestamp: string[];
  };
}

interface MultiTimeframeSignals {
  primary: {
    entry: boolean[];
    exit: boolean[];
    indicators?: Record<string, number[]>;
  };
  secondary: {
    trend: 'up' | 'down' | 'sideways'[];
    strength: number[];
  };
  confluence: {
    entry: boolean[];
    exit: boolean[];
    confidence: number[];
  };
}

export class MultiTimeframeAnalysis {
  /**
   * Align data from different timeframes
   * This is crucial for multi-timeframe analysis
   */
  static alignTimeframes(primaryData: TimeframeData, secondaryData: TimeframeData): {
    primary: TimeframeData;
    alignedSecondary: number[];
  } {
    const alignedSecondary: number[] = [];
    
    // Simple alignment - map each primary bar to the corresponding secondary bar
    for (let i = 0; i < primaryData.data.timestamp.length; i++) {
      const primaryTime = new Date(primaryData.data.timestamp[i]);
      
      // Find the most recent secondary timeframe bar
      let closestIndex = 0;
      for (let j = 0; j < secondaryData.data.timestamp.length; j++) {
        const secondaryTime = new Date(secondaryData.data.timestamp[j]);
        if (secondaryTime <= primaryTime) {
          closestIndex = j;
        } else {
          break;
        }
      }
      
      alignedSecondary.push(closestIndex);
    }
    
    return {
      primary: primaryData,
      alignedSecondary
    };
  }

  /**
   * Execute strategy with multiple timeframe confirmation
   */
  static executeMultiTimeframeStrategy(
    primaryTF: TimeframeData,
    secondaryTF: TimeframeData,
    strategy: {
      primaryLogic: string;
      secondaryLogic: string;
      confluenceRules: string;
    }
  ): MultiTimeframeSignals {
    const { primary, alignedSecondary } = this.alignTimeframes(primaryTF, secondaryTF);
    
    // Execute primary timeframe logic
    const primarySignals = this.executePrimaryLogic(primary.data, strategy.primaryLogic);
    
    // Execute secondary timeframe logic
    const secondarySignals = this.executeSecondaryLogic(secondaryTF.data, strategy.secondaryLogic);
    
    // Apply confluence rules
    const confluenceSignals = this.applyConfluenceRules(
      primarySignals,
      secondarySignals,
      alignedSecondary,
      strategy.confluenceRules
    );
    
    return {
      primary: primarySignals,
      secondary: secondarySignals,
      confluence: confluenceSignals
    };
  }

  private static executePrimaryLogic(data: any, logic: string) {
    // Implement primary timeframe strategy logic
    // This would use the existing StrategyExecutor but with timeframe-specific rules
    return {
      entry: new Array(data.close.length).fill(false),
      exit: new Array(data.close.length).fill(false),
      indicators: {}
    };
  }

  private static executeSecondaryLogic(data: any, logic: string) {
    // Implement secondary timeframe trend analysis
    // Usually focused on trend direction and strength
    return {
      trend: new Array(data.close.length).fill('sideways' as const),
      strength: new Array(data.close.length).fill(0.5)
    };
  }

  private static applyConfluenceRules(
    primary: any,
    secondary: any,
    alignment: number[],
    rules: string
  ) {
    const entry: boolean[] = [];
    const exit: boolean[] = [];
    const confidence: number[] = [];

    for (let i = 0; i < primary.entry.length; i++) {
      const secondaryIndex = alignment[i];
      
      // Simple confluence: primary signal + secondary trend confirmation
      const hasConfluence = primary.entry[i] && 
        secondary.trend[secondaryIndex] === 'up' &&
        secondary.strength[secondaryIndex] > 0.6;
      
      entry.push(hasConfluence);
      exit.push(primary.exit[i]);
      confidence.push(hasConfluence ? 0.8 : 0.3);
    }

    return { entry, exit, confidence };
  }

  /**
   * Calculate timeframe multipliers for proper alignment
   */
  static getTimeframeMultiplier(primary: string, secondary: string): number {
    const timeframes: Record<string, number> = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };

    return timeframes[secondary] / timeframes[primary];
  }
}
