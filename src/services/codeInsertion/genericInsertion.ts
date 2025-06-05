
export class GenericInsertion {
  static integrate(code: string, snippet: string, title: string, functionMatch: RegExpMatchArray): string {
    // Insert before the main logic but after initial calculations
    const emaPattern = /(long_ema = TechnicalAnalysis\.ema\(data\['Close'\]\.tolist\(\), \d+\))/;
    const emaMatch = code.match(emaPattern);
    
    if (emaMatch) {
      const insertPoint = code.indexOf(emaMatch[0]) + emaMatch[0].length;
      const beforeInsert = code.substring(0, insertPoint);
      const afterInsert = code.substring(insertPoint);
      
      return `${beforeInsert}
    
    # ${title} Enhancement
    ${snippet}${afterInsert}`;
    }
    
    // Fallback: insert at the beginning of the function
    return code.replace(/def strategy_logic\(data\):\s*\n/, `def strategy_logic(data):
    # ${title} Enhancement
    ${snippet}
    
`);
  }
}
