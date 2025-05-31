
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface TradeSignal {
  action: 'BUY' | 'SELL' | 'CLOSE'
  symbol: string
  units: number
  stopLoss?: number
  takeProfit?: number
  strategyId: string
  userId: string
}

interface OANDAConfig {
  accountId: string
  apiKey: string
  environment: 'practice' | 'live' // practice for demo
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { signal, config }: { signal: TradeSignal, config: OANDAConfig } = await req.json()

    // OANDA API base URL
    const baseUrl = config.environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com'

    const headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    }

    if (signal.action === 'CLOSE') {
      // Close all positions for this instrument
      const closeResponse = await fetch(
        `${baseUrl}/v3/accounts/${config.accountId}/positions/${signal.symbol}/close`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            longUnits: 'ALL',
            shortUnits: 'ALL'
          })
        }
      )

      const closeResult = await closeResponse.json()
      console.log('Position closed:', closeResult)

      return new Response(JSON.stringify({
        success: true,
        action: 'CLOSE',
        result: closeResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create market order
    const orderData = {
      order: {
        type: 'MARKET',
        instrument: signal.symbol,
        units: signal.action === 'BUY' ? signal.units : -signal.units,
        timeInForce: 'FOK', // Fill or Kill
        ...(signal.stopLoss && {
          stopLossOnFill: {
            price: signal.stopLoss.toString()
          }
        }),
        ...(signal.takeProfit && {
          takeProfitOnFill: {
            price: signal.takeProfit.toString()
          }
        })
      }
    }

    const response = await fetch(
      `${baseUrl}/v3/accounts/${config.accountId}/orders`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`OANDA API Error: ${result.errorMessage || 'Unknown error'}`)
    }

    console.log('Trade executed:', result)

    return new Response(JSON.stringify({
      success: true,
      action: signal.action,
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Trade execution error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
