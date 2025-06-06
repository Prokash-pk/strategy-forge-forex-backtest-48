
import { supabase } from '@/integrations/supabase/client';
import { OANDAMarketDataService } from './oandaMarketDataService';
import { PythonExecutor } from './pythonExecutor';
import { SignalProcessor } from './trading/signalProcessor';
import { OANDAConfig, StrategySettings } from '@/types/oanda';

export interface ForwardTestingSession {
  id: string;
  strategyId: string;
  oandaAccountId: string;
  oandaApiKey: string;
  environment: 'practice' | 'live';
  enabled: boolean;
  startTime: string;
  lastExecutionTime?: string;
}

export class ForwardTestingService {
  private static instance: ForwardTestingService;
  private activeSessions: Map<string, ForwardTestingSession> = new Map();
  private signalProcessor: SignalProcessor;

  private constructor() {
    this.signalProcessor = SignalProcessor.getInstance();
  }

  static getInstance(): ForwardTestingService {
    if (!ForwardTestingService.instance) {
      ForwardTestingService.instance = new ForwardTestingService();
    }
    return ForwardTestingService.instance;
  }

  async startForwardTesting(config: OANDAConfig & { strategyId: string; enabled: boolean }, strategy: StrategySettings): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const sessionId = `${user.id}_${config.strategyId}`;
      
      console.log('🚀 Starting forward testing session:', sessionId);
      console.log('📊 Strategy:', strategy.strategy_name);
      console.log('🏦 OANDA Account:', config.oandaAccountId);
      console.log('🌍 Environment:', config.environment);

      // Initialize the signal processor with trade bridge
      const bridgeInitialized = await this.signalProcessor.initializeTradeBridge(config.strategyId);
      if (!bridgeInitialized) {
        throw new Error('Failed to initialize trade bridge - check OANDA configuration');
      }

      const session: ForwardTestingSession = {
        id: sessionId,
        strategyId: config.strategyId,
        oandaAccountId: config.oandaAccountId,
        oandaApiKey: config.oandaApiKey,
        environment: config.environment,
        enabled: config.enabled,
        startTime: new Date().toISOString()
      };

      this.activeSessions.set(sessionId, session);

      // Save session to database for persistence
      await supabase.from('forward_testing_sessions').upsert({
        id: sessionId,
        user_id: user.id,
        strategy_id: config.strategyId,
        oanda_account_id: config.oandaAccountId,
        environment: config.environment,
        enabled: config.enabled,
        start_time: session.startTime,
        session_data: {
          strategy_name: strategy.strategy_name,
          symbol: strategy.symbol,
          timeframe: strategy.timeframe
        }
      });

      console.log('✅ Forward testing session started successfully');
      console.log('🤖 Trade execution is now LIVE - signals will be converted to real trades');
      
      // Start the execution loop
      this.startExecutionLoop(sessionId, strategy);

    } catch (error) {
      console.error('❌ Failed to start forward testing:', error);
      throw error;
    }
  }

  async stopForwardTesting(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🛑 Stopping all forward testing sessions...');

      // Clear active sessions
      this.activeSessions.clear();

      // Update database
      await supabase
        .from('forward_testing_sessions')
        .update({ enabled: false, end_time: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('enabled', true);

      console.log('✅ Forward testing stopped');
    } catch (error) {
      console.error('❌ Error stopping forward testing:', error);
    }
  }

  private async startExecutionLoop(sessionId: string, strategy: StrategySettings): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.enabled) return;

    console.log(`🔄 Starting execution loop for session: ${sessionId}`);

    const executeSignalCheck = async () => {
      if (!this.activeSessions.has(sessionId)) {
        console.log(`⏹️ Session ${sessionId} no longer active, stopping execution loop`);
        return;
      }

      try {
        await this.checkAndExecuteSignals(session, strategy);
      } catch (error) {
        console.error(`❌ Error in execution loop for ${sessionId}:`, error);
      }

      // Schedule next execution (every 5 minutes)
      if (this.activeSessions.has(sessionId)) {
        setTimeout(executeSignalCheck, 5 * 60 * 1000); // 5 minutes
      }
    };

    // Start the loop
    executeSignalCheck();
  }

  private async checkAndExecuteSignals(session: ForwardTestingSession, strategy: StrategySettings): Promise<void> {
    try {
      console.log(`📈 Checking signals for strategy: ${strategy.strategy_name}`);

      // Convert symbol to OANDA format
      const oandaSymbol = OANDAMarketDataService.convertSymbolToOANDA(strategy.symbol);

      // Fetch latest market data
      const marketData = await OANDAMarketDataService.fetchLiveMarketData(
        session.oandaAccountId,
        session.oandaApiKey,
        session.environment,
        oandaSymbol,
        'M1', // 1-minute candles
        100   // Last 100 candles
      );

      console.log(`📊 Fetched ${marketData.close.length} data points for analysis`);

      // Execute strategy logic
      const strategyResult = await PythonExecutor.executeStrategy(
        strategy.strategy_code,
        marketData
      );

      // Check latest signals
      const latestIndex = marketData.close.length - 1;
      const hasEntry = strategyResult.entry && strategyResult.entry[latestIndex];
      const direction = strategyResult.direction && strategyResult.direction[latestIndex];
      
      console.log(`🔍 Signal check result:`, {
        hasEntry,
        direction,
        currentPrice: marketData.close[latestIndex],
        timestamp: new Date().toISOString()
      });

      // Process signal if entry is detected
      if (hasEntry && direction && (direction === 'BUY' || direction === 'SELL')) {
        console.log(`🚨 TRADE SIGNAL DETECTED: ${direction} ${strategy.symbol}`);

        const signal = {
          signal: direction as 'BUY' | 'SELL',
          symbol: strategy.symbol,
          currentPrice: marketData.close[latestIndex],
          timestamp: new Date().toISOString(),
          confidence: 0.8, // Default confidence
          strategyName: strategy.strategy_name
        };

        // Execute the trade through signal processor
        const result = await this.signalProcessor.processSignal(signal);
        
        if (result.tradeExecuted) {
          console.log('✅ REAL TRADE EXECUTED SUCCESSFULLY!');
        } else {
          console.log('❌ Trade execution failed:', result.message);
        }

        // Update session last execution time
        session.lastExecutionTime = new Date().toISOString();
        await supabase
          .from('forward_testing_sessions')
          .update({ last_execution_time: session.lastExecutionTime })
          .eq('id', session.id);
      } else {
        console.log('📊 No trade signals detected - monitoring continues...');
      }

    } catch (error) {
      console.error('❌ Error checking signals:', error);
      
      // Log the error
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('trading_logs').insert({
          user_id: user.id,
          session_id: session.id,
          log_type: 'error',
          message: `Signal check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          trade_data: {
            error_details: error,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }

  async getActiveSessions(): Promise<ForwardTestingSession[]> {
    return Array.from(this.activeSessions.values());
  }
}
