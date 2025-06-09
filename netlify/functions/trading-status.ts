
// API endpoint to check trading system status and manage sessions

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status':
        return await getTradingStatus();
      
      case 'start':
        return await startTradingSession(req);
      
      case 'stop':
        return await stopTradingSession(req);
      
      case 'logs':
        return await getTradingLogs();
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

  } catch (error) {
    console.error('Trading status API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

async function getTradingStatus() {
  // Get status of all trading sessions
  const status = {
    systemStatus: 'ONLINE',
    lastExecution: new Date().toISOString(),
    activeSessions: 0,
    totalExecutions: 0,
    serverTime: new Date().toISOString(),
    nextExecution: getNextExecutionTime()
  };

  return new Response(
    JSON.stringify(status),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function startTradingSession(req: Request) {
  const sessionData = await req.json();
  
  console.log('🚀 Starting new trading session:', sessionData);
  
  // Validate session data
  if (!sessionData.strategy_code || !sessionData.symbol || !sessionData.oanda_account_id) {
    return new Response(
      JSON.stringify({ 
        error: 'Missing required session data',
        required: ['strategy_code', 'symbol', 'oanda_account_id', 'oanda_api_key']
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Save session to database (mock for now)
  const sessionId = `session_${Date.now()}`;
  
  return new Response(
    JSON.stringify({
      message: 'Trading session started',
      sessionId,
      status: 'ACTIVE',
      nextExecution: getNextExecutionTime()
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function stopTradingSession(req: Request) {
  const { sessionId } = await req.json();
  
  console.log('⏹️ Stopping trading session:', sessionId);
  
  return new Response(
    JSON.stringify({
      message: 'Trading session stopped',
      sessionId,
      status: 'STOPPED'
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function getTradingLogs() {
  // Return recent trading logs
  const logs = [
    {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Trading system operational',
      session: 'system'
    }
  ];

  return new Response(
    JSON.stringify({ logs }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

function getNextExecutionTime() {
  const now = new Date();
  const next = new Date(now);
  
  // Next execution is at the next 5-minute interval
  const minutes = now.getMinutes();
  const nextMinutes = Math.ceil(minutes / 5) * 5;
  
  next.setMinutes(nextMinutes, 0, 0);
  
  if (nextMinutes >= 60) {
    next.setHours(now.getHours() + 1, 0, 0, 0);
  }
  
  return next.toISOString();
}
