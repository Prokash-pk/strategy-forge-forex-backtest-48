
import { OANDAConfig } from './types';

export async function testOANDAConnection(config: OANDAConfig): Promise<any> {
  if (!config.accountId || !config.apiKey) {
    throw new Error('Missing Account ID or API Key');
  }

  const baseUrl = config.environment === 'practice' 
    ? 'https://api-fxpractice.oanda.com'
    : 'https://api-fxtrade.oanda.com';

  console.log('🔍 Testing OANDA connection...', {
    baseUrl,
    accountId: config.accountId,
    environment: config.environment
  });

  // Multiple attempts with different timeouts and strategies
  const attempts = [
    { timeout: 5000, description: 'Quick attempt' },
    { timeout: 10000, description: 'Standard attempt' },
    { timeout: 20000, description: 'Extended attempt' }
  ];

  let lastError: Error;

  for (const attempt of attempts) {
    try {
      console.log(`🔄 ${attempt.description} (${attempt.timeout}ms timeout)`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), attempt.timeout);

      const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Datetime-Format': 'UNIX',
          'User-Agent': 'TradingBot/1.0',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.errorMessage || errorMessage;
          
          if (response.status === 401) {
            throw new Error('Invalid API key. Please check your OANDA API credentials.');
          } else if (response.status === 403) {
            throw new Error('Access forbidden. Please verify your API key has proper permissions.');
          } else if (response.status === 404) {
            throw new Error('Account not found. Please verify your Account ID is correct.');
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        
        lastError = new Error(errorMessage);
        console.warn(`⚠️ ${attempt.description} failed:`, errorMessage);
        
        // Don't retry auth errors
        if (response.status === 401 || response.status === 403) {
          throw lastError;
        }
        
        continue; // Try next attempt
      }

      const data = await response.json();
      console.log('✅ OANDA connection successful:', data);
      
      return data;

    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`⚠️ ${attempt.description} timed out`);
        lastError = new Error(`Connection timeout (${attempt.timeout}ms) - OANDA servers may be slow`);
      } else {
        console.warn(`⚠️ ${attempt.description} failed:`, error);
      }
      
      // Don't retry non-timeout errors
      if (!(error instanceof Error && error.name === 'AbortError')) {
        break;
      }
    }
  }
  
  // Enhanced error logging
  console.error('❌ All OANDA connection attempts failed:', {
    error: lastError?.message || 'Unknown error',
    config: {
      environment: config.environment,
      accountId: config.accountId,
      hasApiKey: !!config.apiKey
    }
  });
  
  throw lastError || new Error('Connection failed after multiple attempts');
}
