
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Mock server sessions data for diagnostics
    const sessions = {
      active_sessions: 1,
      total_sessions: 1,
      server_uptime: "24h 30m",
      last_activity: new Date().toISOString(),
      status: "healthy"
    }

    return new Response(JSON.stringify(sessions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Server sessions error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
