
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Mock server logs for diagnostics
    const logs = {
      recent_logs: [
        {
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Trading system operational",
          component: "strategy_executor"
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: "info",
          message: "Market data fetched successfully",
          component: "data_service"
        }
      ],
      log_count: 2,
      last_updated: new Date().toISOString()
    }

    return new Response(JSON.stringify(logs), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Server logs error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
