
import { IBConnectionService } from './ibConnectionService';

export class IBUtilityService {
  static async getContractId(symbol: string): Promise<number> {
    try {
      const ibSymbol = this.convertSymbolToIB(symbol);
      const baseUrl = IBConnectionService.getBaseUrl();
      const response = await fetch(`${baseUrl}/iserver/secdef/search?symbol=${ibSymbol}`, {
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data[0]?.conid || 0;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get contract ID:', error);
      return 0;
    }
  }

  static convertSymbolToIB(symbol: string): string {
    let ibSymbol = symbol;
    
    if (symbol.includes('=X')) {
      ibSymbol = symbol.replace('=X', '');
    }
    
    if (symbol.includes('/')) {
      ibSymbol = symbol.replace('/', '.');
    } else if (symbol.length === 6 && !symbol.includes('.')) {
      ibSymbol = `${symbol.slice(0, 3)}.${symbol.slice(3)}`;
    }

    return ibSymbol;
  }
}
