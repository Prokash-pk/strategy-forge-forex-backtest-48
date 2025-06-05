
import { BaseCodeInsertion } from './codeInsertion/baseCodeInsertion';
import { TrendFilterInsertion } from './codeInsertion/trendFilterInsertion';
import { ExitStrategyInsertion } from './codeInsertion/exitStrategyInsertion';
import { RiskManagementInsertion } from './codeInsertion/riskManagementInsertion';
import { VolatilityFilterInsertion } from './codeInsertion/volatilityFilterInsertion';
import { DynamicStopLossInsertion } from './codeInsertion/dynamicStopLossInsertion';
import { GenericInsertion } from './codeInsertion/genericInsertion';

export class StrategyCodeInsertion {
  static insertCodeSnippet(existingCode: string, snippet: string, title: string): string {
    console.log('Inserting code snippet:', { title, snippet: snippet.substring(0, 100) + '...' });
    
    if (!existingCode.trim()) {
      return BaseCodeInsertion.createBasicStrategyWithSnippet(snippet, title);
    }

    // Check if snippet already exists to prevent duplicates
    if (BaseCodeInsertion.checkSnippetExists(existingCode, snippet)) {
      console.log('Snippet already exists, skipping');
      return existingCode;
    }

    // Find the strategy_logic function and intelligently integrate the snippet
    const functionMatch = BaseCodeInsertion.findStrategyLogicFunction(existingCode);
    
    if (functionMatch) {
      // Handle different types of recommendations with actual logic replacement
      if (title.includes('Trend Filter') || title.includes('Add Trend')) {
        return TrendFilterInsertion.integrate(existingCode, snippet, functionMatch);
      } else if (title.includes('Trailing Stop') || title.includes('Exit Strategy')) {
        return ExitStrategyInsertion.integrate(existingCode, snippet, functionMatch);
      } else if (title.includes('Position Size') || title.includes('Risk')) {
        return RiskManagementInsertion.integrate(existingCode, snippet, functionMatch);
      } else if (title.includes('Volatility') || title.includes('Filter')) {
        return VolatilityFilterInsertion.integrate(existingCode, snippet, functionMatch);
      } else if (title.includes('Dynamic Stop Loss')) {
        return DynamicStopLossInsertion.integrate(existingCode, snippet, functionMatch);
      } else {
        return GenericInsertion.integrate(existingCode, snippet, title, functionMatch);
      }
    } else {
      return `${existingCode}

# ${title} (Strategy Coach Enhancement)
${snippet}`;
    }
  }

  static insertMultipleSnippets(existingCode: string, snippets: Array<{code: string, title: string}>): string {
    let updatedCode = existingCode;
    
    snippets.forEach((snippet, index) => {
      console.log(`Inserting snippet ${index + 1}/${snippets.length}: ${snippet.title}`);
      updatedCode = this.insertCodeSnippet(updatedCode, snippet.code, snippet.title);
    });
    
    return updatedCode;
  }
}
