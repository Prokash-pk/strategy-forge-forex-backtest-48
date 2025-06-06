
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
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errorMessage || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ OANDA connection successful:', data);
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Connection timeout - please check your internet connection and try again');
    }
    
    throw error;
  }
}
