
export class RiskManagementInsertion {
  static integrate(code: string, snippet: string, functionMatch: RegExpMatchArray): string {
    // Insert at the beginning of the function after the def line
    const functionStart = code.indexOf('def strategy_logic(data):') + 'def strategy_logic(data):'.length;
    const beforeFunction = code.substring(0, functionStart);
    const afterFunction = code.substring(functionStart);
    
    return `${beforeFunction}
    # Risk Management Enhancement
    ${snippet}
${afterFunction}`;
  }
}
