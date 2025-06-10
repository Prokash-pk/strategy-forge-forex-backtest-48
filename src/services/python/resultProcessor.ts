
import type { StrategyResult, MarketData } from './types';

export class ResultProcessor {
  static processResult(pythonResult: any, marketData: MarketData): StrategyResult {
    console.log('🔍 Processing Python result...');
    
    if (pythonResult === undefined || pythonResult === null) {
      console.error('❌ Python execution returned undefined/null');
      return this.createFallbackResult(marketData, 'Python execution returned undefined result');
    }

    // Handle different result types safely
    let jsResult;
    
    try {
      // Case 1: Result already is a JavaScript object (plain object)
      if (pythonResult && typeof pythonResult === 'object' && pythonResult.constructor === Object) {
        console.log('✅ Result is already a plain JavaScript object');
        jsResult = pythonResult;
      }
      // Case 2: Result is a Pyodide proxy object with toJs method
      else if (pythonResult && typeof pythonResult === 'object' && typeof pythonResult.toJs === 'function') {
        console.log('🔄 Converting Pyodide proxy to JavaScript...');
        jsResult = pythonResult.toJs({ dict_converter: Object.fromEntries });
        console.log('✅ Conversion successful');
      }
      // Case 3: Result is some other type of object
      else if (pythonResult && typeof pythonResult === 'object') {
        console.log('🔄 Converting non-proxy object...');
        jsResult = JSON.parse(JSON.stringify(pythonResult));
        console.log('✅ Object conversion successful');
      }
      // Case 4: Unexpected result type
      else {
        console.error('❌ Unexpected Python result type:', typeof pythonResult, pythonResult);
        return this.createFallbackResult(marketData, `Unexpected Python result type: ${typeof pythonResult}`);
      }
    } catch (conversionError) {
      console.error('❌ Error converting Python result to JavaScript:', conversionError);
      return this.createFallbackResult(marketData, `Result conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'}`);
    }

    // Final validation of converted result
    if (!jsResult || typeof jsResult !== 'object') {
      console.error('❌ Final result validation failed:', jsResult);
      return this.createFallbackResult(marketData, 'Invalid result format after conversion');
    }
    
    console.log('✅ Result processing completed successfully');
    return jsResult as StrategyResult;
  }

  static createFallbackResult(marketData: MarketData, errorMessage: string): StrategyResult {
    const length = marketData?.close?.length || 0;
    return {
      entry: new Array(length).fill(false),
      exit: new Array(length).fill(false),
      direction: new Array(length).fill(null),
      error: errorMessage
    };
  }

  static validateResult(result: any, marketData: MarketData): { isValid: boolean; error?: string } {
    if (!result || typeof result !== 'object') {
      return { isValid: false, error: 'Result is not an object' };
    }

    const requiredFields = ['entry', 'exit', 'direction'];
    for (const field of requiredFields) {
      if (!Array.isArray(result[field])) {
        return { isValid: false, error: `Missing or invalid field: ${field}` };
      }
    }

    const expectedLength = marketData?.close?.length || 0;
    for (const field of requiredFields) {
      if (result[field].length !== expectedLength) {
        return { isValid: false, error: `Field ${field} has incorrect length` };
      }
    }

    return { isValid: true };
  }
}
