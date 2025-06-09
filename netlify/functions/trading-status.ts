
import { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const action = event.queryStringParameters?.action;

    switch (action) {
      case 'status':
        return await getTradingStatus();
      
      case 'start':
        return await startTradingSession(event);
      
      case 'stop':
        return await stopTradingSession(event);
      
      case 'logs':
        return await getTradingLogs();
      
      default:
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

  } catch (error) {
    console.error('Trading status API error:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
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

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(status)
  };
}

async function startTradingSession(event) {
  const sessionData = JSON.parse(event.body || '{}');
  
  console.log('🚀 Starting new trading session:', sessionData);
  
  // Validate session data
  if (!sessionData.strategy_code || !sessionData.symbol || !sessionData.oanda_account_id) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Missing required session data',
        required: ['strategy_code', 'symbol', 'oanda_account_id', 'oanda_api_key']
      })
    };
  }

  // Save session to database (mock for now)
  const sessionId = `session_${Date.now()}`;
  
  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Trading session started',
      sessionId,
      status: 'ACTIVE',
      nextExecution: getNextExecutionTime()
    })
  };
}

async function stopTradingSession(event) {
  const { sessionId } = JSON.parse(event.body || '{}');
  
  console.log('⏹️ Stopping trading session:', sessionId);
  
  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Trading session stopped',
      sessionId,
      status: 'STOPPED'
    })
  };
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

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs })
  };
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
