
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface TradeSignal {
  action: 'BUY' | 'SELL' | 'CLOSE'
  symbol: string
  units: number
  stopLoss?: string
  takeProfit?: string
  strategyId: string
  userId: string
}

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
    const { signal, config, testMode }: { 
      signal: TradeSignal, 
      config: OANDAConfig,
      testMode?: boolean 
    } = await req.json()

    console.log('Received trade signal:', signal)
    console.log('Using config:', { 
      accountId: config.accountId, 
      environment: config.environment,
      testMode: testMode || false
    })

    // OANDA API base URL
    const baseUrl = config.environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com'

    const headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept-Datetime-Format': 'UNIX'
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
      console.log('Position close response:', closeResult)

      return new Response(JSON.stringify({
        success: closeResponse.ok,
        action: 'CLOSE',
        result: closeResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create market order with proper error handling
    const orderData = {
      order: {
        type: 'MARKET',
        instrument: signal.symbol,
        units: signal.action === 'BUY' ? signal.units.toString() : (-signal.units).toString(),
        timeInForce: 'FOK', // Fill or Kill
        positionFill: 'DEFAULT'
      }
    }

    // Add stop loss if provided
    if (signal.stopLoss) {
      orderData.order.stopLossOnFill = {
        price: signal.stopLoss,
        timeInForce: 'GTC'
      }
    }

    // Add take profit if provided
    if (signal.takeProfit) {
      orderData.order.takeProfitOnFill = {
        price: signal.takeProfit,
        timeInForce: 'GTC'
      }
    }

    console.log('Sending order to OANDA:', JSON.stringify(orderData, null, 2))

    const response = await fetch(
      `${baseUrl}/v3/accounts/${config.accountId}/orders`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      }
    )

    const result = await response.json()
    console.log('OANDA response status:', response.status)
    console.log('OANDA response:', JSON.stringify(result, null, 2))

    if (!response.ok) {
      const errorMsg = result.errorMessage || result.message || `HTTP ${response.status}: ${response.statusText}`
      console.error('OANDA API Error:', errorMsg)
      throw new Error(`OANDA API Error: ${errorMsg}`)
    }

    // Check if order was successful
    const orderTransaction = result.orderCreateTransaction
    const orderFillTransaction = result.orderFillTransaction
    
    if (orderTransaction) {
      console.log('Order created successfully:', orderTransaction.id)
      
      if (orderFillTransaction) {
        console.log('Order filled successfully:', orderFillTransaction.id)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      action: signal.action,
      result: result,
      orderCreateTransaction: orderTransaction,
      orderFillTransaction: orderFillTransaction
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Trade execution error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
