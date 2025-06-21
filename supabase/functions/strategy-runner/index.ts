// Complete index.ts file with trade execution logic

import { corsHeaders } from '../_shared/cors.ts'

// --- Configuration ---
const OANDA_API_KEY = Deno.env.get("OANDA_API_KEY")
const OANDA_ACCOUNT_ID = Deno.env.get("OANDA_ACCOUNT_ID")
const OANDA_API_URL = "https://api-fxpractice.oanda.com"

const INSTRUMENT = "EUR_USD"
const SHORT_WINDOW = 10
const LONG_WINDOW = 20

// --- Helper Functions ---

async function getCandleData(count: number) {
  console.log(`Fetching ${count} candles for ${INSTRUMENT}...`)
  const url = `${OANDA_API_URL}/v3/instruments/${INSTRUMENT}/candles?count=${count}&price=M&granularity=M1`
  const response = await fetch(url, { headers: { "Authorization": `Bearer ${OANDA_API_KEY}` } })
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OANDA API Error: ${errorText}`)
  }
  const data = await response.json()
  return data.candles.map((c: any) => parseFloat(c.mid.c))
}

function calculateSMA(prices: number[], window: number): number {
  if (prices.length < window) return 0
  const slice = prices.slice(-window)
  const sum = slice.reduce((a, b) => a + b, 0)
  return sum / window
}

// NEW FUNCTION: Function to create a market order
async function createMarketOrder(instrument: string, units: number) {
  console.log(`Attempting to place a market order for ${units} units of ${instrument}...`)
  const url = `${OANDA_API_URL}/v3/accounts/${OANDA_ACCOUNT_ID}/orders`
  const orderBody = {
    order: {
      units: String(units),
      instrument: instrument,
      timeInForce: "FOK",
      type: "MARKET",
      positionFill: "DEFAULT"
    }
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${OANDA_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(orderBody)
  })
  const responseData = await response.json()
  if (!response.ok) {
    console.error("OANDA Order Error:", responseData)
    throw new Error(`OANDA Order Error: ${responseData.errorMessage || 'Unknown error'}`)
  }
  console.log("OANDA Order Response:", responseData)
  console.log("Trade placed successfully!")
  return responseData
}

// --- Main Logic ---
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    console.log(`--- Strategy Check for ${INSTRUMENT} ---`)
    const prices = await getCandleData(LONG_WINDOW + 5)
    console.log(`Fetched ${prices.length} price points successfully.`)
    if (prices.length < LONG_WINDOW) throw new Error("Not enough data to calculate MAs.")

    const shortMA = calculateSMA(prices, SHORT_WINDOW)
    const longMA = calculateSMA(prices, LONG_WINDOW)
    console.log(`Latest MAs: Short MA = ${shortMA.toFixed(5)}, Long MA = ${longMA.toFixed(5)}`)

    const prevPrices = prices.slice(0, -1)
    const prevShortMA = calculateSMA(prevPrices, SHORT_WINDOW)
    const prevLongMA = calculateSMA(prevPrices, LONG_WINDOW)
    const isCrossedUp = prevShortMA <= prevLongMA && shortMA > longMA

    if (isCrossedUp) {
      console.log(`BUY SIGNAL DETECTED! Short MA crossed above Long MA.`)
      await createMarketOrder(INSTRUMENT, 100); // Buy 100 units
    } else {
      console.log("No crossover detected. No signal.")
    }

    return new Response(
      JSON.stringify({ message: "Strategy check complete.", signal: isCrossedUp ? "BUY" : "NONE" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error) {
    console.error("Error during strategy execution:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})