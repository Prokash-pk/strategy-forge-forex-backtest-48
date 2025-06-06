
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased to 8 seconds

  try {
    const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept-Datetime-Format': 'UNIX'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.errorMessage || errorMessage;
        
        // Provide specific guidance for common errors
        if (response.status === 401) {
          errorMessage = 'Invalid API key. Please check your OANDA API credentials.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. Please verify your API key has proper permissions.';
        } else if (response.status === 404) {
          errorMessage = 'Account not found. Please verify your Account ID is correct.';
        }
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ OANDA connection successful:', data);
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Connection timeout (8s) - OANDA servers may be slow. Please try again or check your internet connection.');
    }
    
    // Enhanced error logging
    console.error('❌ OANDA connection failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        environment: config.environment,
        accountId: config.accountId,
        hasApiKey: !!config.apiKey
      }
    });
    
    throw error;
  }
}
