
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

    // Convert symbol to OANDA format (ensure underscore format)
    let oandaSymbol = signal.symbol;
    if (signal.symbol.includes('/')) {
      oandaSymbol = signal.symbol.replace('/', '_');
    } else if (signal.symbol.includes('=X')) {
      // Handle Yahoo Finance format like USDJPY=X
      oandaSymbol = signal.symbol.replace('=X', '').replace(/(.{3})(.{3})/, '$1_$2');
    } else if (signal.symbol.length === 6 && !signal.symbol.includes('_')) {
      // Handle 6-character format like USDJPY
      oandaSymbol = signal.symbol.replace(/(.{3})(.{3})/, '$1_$2');
    }

    console.log('Converted symbol from', signal.symbol, 'to', oandaSymbol);

    if (signal.action === 'CLOSE') {
      // Close all positions for this instrument
      const closeResponse = await fetch(
        `${baseUrl}/v3/accounts/${config.accountId}/positions/${oandaSymbol}/close`,
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

      // Check for specific OANDA error conditions
      if (!closeResponse.ok) {
        // Handle specific OANDA errors more gracefully
        if (closeResult.errorCode === 'CLOSEOUT_POSITION_DOESNT_EXIST') {
          return new Response(JSON.stringify({
            success: false,
            action: 'CLOSE',
            result: closeResult,
            userMessage: 'Position does not exist or has already been closed'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        
        return new Response(JSON.stringify({
          success: false,
          action: 'CLOSE',
          result: closeResult,
          userMessage: closeResult.errorMessage || 'Failed to close position'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check if both long and short orders were rejected
      const longRejected = closeResult.longOrderRejectTransaction?.rejectReason === 'CLOSEOUT_POSITION_DOESNT_EXIST'
      const shortRejected = closeResult.shortOrderRejectTransaction?.rejectReason === 'CLOSEOUT_POSITION_DOESNT_EXIST'
      
      if (longRejected && shortRejected) {
        return new Response(JSON.stringify({
          success: false,
          action: 'CLOSE',
          result: closeResult,
          userMessage: 'No positions found to close for this instrument'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // If we get here, the close was successful (at least partially)
      return new Response(JSON.stringify({
        success: true,
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
        instrument: oandaSymbol,
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
