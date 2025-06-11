
export const testOANDAConnection = async (config: any) => {
  console.log('🔍 Testing OANDA connection with detailed diagnostics...');
  console.log('📊 Config details:', {
    accountId: config.accountId,
    apiKeyLength: config.apiKey?.length || 0,
    apiKeyPrefix: config.apiKey?.substring(0, 10) + '...',
    environment: config.environment
  });

  if (!config.accountId || !config.apiKey) {
    throw new Error('Missing OANDA credentials');
  }

  const baseUrl = config.environment === 'practice' 
    ? 'https://api-fxpractice.oanda.com'
    : 'https://api-fxtrade.oanda.com';

  console.log('🌐 Making direct request to OANDA API...');
  console.log('🔗 OANDA URL:', `${baseUrl}/v3/accounts/${config.accountId}`);
  console.log('🔑 Authorization header:', `Bearer ${config.apiKey.substring(0, 10)}...`);

  try {
    const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Datetime-Format': 'UNIX'
      }
    });

    console.log('📡 OANDA response status:', response.status);
    console.log('📡 OANDA response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.error('❌ OANDA API error data:', errorData);
        errorMessage = errorData.errorMessage || errorData.message || errorMessage;
        
        if (response.status === 401) {
          errorMessage = 'Invalid OANDA API key. Please check your credentials.';
        } else if (response.status === 403) {
          errorMessage = 'OANDA API access forbidden. Verify your API key permissions.';
        } else if (response.status === 404) {
          errorMessage = 'Account not found. Please verify your Account ID is correct.';
        }
      } catch (parseError) {
        console.warn('Could not parse OANDA error response:', parseError);
      }
      
      console.error(`❌ OANDA API Error:`, errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ OANDA API response data:', result);

    if (!result.account) {
      console.error('❌ No account data in response');
      throw new Error('No account data received from OANDA');
    }

    console.log('🎉 OANDA connection successful!');
    console.log('📊 Account info:', {
      alias: result.account?.alias,
      currency: result.account?.currency,
      balance: result.account?.balance,
      id: result.account?.id
    });

    return result;

  } catch (error) {
    console.error('❌ Connection test failed with error:', error);
    console.error('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};
