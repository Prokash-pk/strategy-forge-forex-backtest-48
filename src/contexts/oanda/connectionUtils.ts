
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

  console.log('🌐 Making request to Supabase edge function for OANDA test...');

  try {
    // Get the current origin to construct the correct edge function URL
    const currentOrigin = window.location.origin;
    const functionUrl = `${currentOrigin}/functions/v1/oanda-connection-test`;
    
    console.log('🔗 Edge function URL:', functionUrl);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config })
    });

    console.log('📡 Server response status:', response.status);
    console.log('📡 Server response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server response error:', errorText);
      
      // If we get HTML (404 page), the edge function doesn't exist
      if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
        throw new Error('Edge function not found. The OANDA connection test function may not be deployed.');
      }
      
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Server response data:', result);

    if (!result.success) {
      console.error('❌ OANDA API returned error:', result.error);
      throw new Error(result.error || 'OANDA connection failed');
    }

    console.log('🎉 OANDA connection successful!');
    console.log('📊 Account info:', {
      alias: result.result?.account?.alias,
      currency: result.result?.account?.currency,
      balance: result.result?.account?.balance,
      id: result.result?.account?.id
    });

    return result.result;

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
