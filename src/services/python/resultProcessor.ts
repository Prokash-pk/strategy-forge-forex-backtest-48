
export class PythonResultProcessor {
  static processExecutionResult(result: any): any {
    try {
      // Handle undefined/null results first
      if (result === undefined || result === null) {
        console.warn('⚠️ Python execution returned null/undefined result');
        return null;
      }

      // Convert PyProxy to JavaScript object if needed
      const jsResult = result.toJs ? result.toJs({ dict_converter: Object.fromEntries }) : result;
      
      console.log('🎯 Processing execution result:', {
        hasResult: !!jsResult,
        resultKeys: Object.keys(jsResult || {}),
        resultType: typeof jsResult
      });

      if (jsResult) {
        // Log signal information
        const entrySignalsCount = jsResult?.entry?.filter?.(Boolean)?.length || 0;
        const exitSignalsCount = jsResult?.exit?.filter?.(Boolean)?.length || 0;
        
        console.log('📊 Signal analysis:', {
          entrySignalsCount,
          exitSignalsCount,
          lastEntrySignal: jsResult?.entry?.[jsResult.entry.length - 1],
          lastDirection: jsResult?.direction?.[jsResult.direction.length - 1],
          hasError: !!jsResult?.error
        });
      }

      return jsResult;
    } catch (error) {
      console.error('❌ Failed to process execution result:', error);
      return null;
    }
  }
}
