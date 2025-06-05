
export class ExitStrategyInsertion {
  static integrate(code: string, snippet: string, functionMatch: RegExpMatchArray): string {
    // Insert before the main loop
    const loopPattern = /(\s+)(for i in range\(len\(data\)\):)/;
    const loopMatch = code.match(loopPattern);
    
    if (loopMatch) {
      const insertPoint = code.indexOf(loopMatch[0]);
      const beforeInsert = code.substring(0, insertPoint);
      const afterInsert = code.substring(insertPoint);
      
      return `${beforeInsert}    
    # Enhanced exit strategy
    ${snippet}
    
${afterInsert}`;
    }
    
    return code;
  }
}
