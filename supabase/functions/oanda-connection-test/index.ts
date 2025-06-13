
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface OANDAConfig {
  accountId: string
  apiKey: string
  environment: 'practice' | 'live'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { config }: { config: OANDAConfig } = await req.json()

    console.log('Testing OANDA connection for account:', config.accountId)

    // OANDA API base URL
    const baseUrl = config.environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com'

    const headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Datetime-Format': 'UNIX'
    }

    // Test connection by fetching account info
    const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.errorMessage || errorMessage
        
        if (response.status === 401) {
          errorMessage = 'Invalid API key. Please check your OANDA API credentials.'
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. Please verify your API key has proper permissions.'
        } else if (response.status === 404) {
          errorMessage = 'Account not found. Please verify your Account ID is correct.'
        }
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError)
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const result = await response.json()
    console.log('OANDA connection test successful:', result.account?.alias || config.accountId)

    return new Response(JSON.stringify({
      success: true,
      result: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Connection test error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
