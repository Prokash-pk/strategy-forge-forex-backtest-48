
export class VolatilityFilterInsertion {
  static integrate(code: string, snippet: string, functionMatch: RegExpMatchArray): string {
    // Insert after EMA calculations
    const emaPattern = /(long_ema = TechnicalAnalysis\.ema\(data\['Close'\]\.tolist\(\), \d+\))/;
    const emaMatch = code.match(emaPattern);
    
    if (emaMatch) {
      const insertPoint = code.indexOf(emaMatch[0]) + emaMatch[0].length;
      const beforeInsert = code.substring(0, insertPoint);
      const afterInsert = code.substring(insertPoint);
      
      return `${beforeInsert}
    
    # Volatility filter
    ${snippet}${afterInsert}`;
    }
    
    return code;
  }
}
