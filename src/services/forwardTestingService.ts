import { supabase } from '@/integrations/supabase/client';
import { OANDAMarketDataService } from './oandaMarketDataService';
import { PythonExecutor } from './pythonExecutor';
import { SignalProcessor } from './trading/signalProcessor';
import { ConsoleLogger } from './autoTesting/consoleLogger';
import { OANDAConfig, StrategySettings } from '@/types/oanda';

export interface ForwardTestingSession {
  id: string;
  strategyId: string;
  accountId: string;
  apiKey: string;
  environment: 'practice' | 'live';
  enabled: boolean;
  startTime: string;
  lastExecutionTime?: string;
}

export interface ForwardTestingStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  lastExecution?: string;
}

export class ForwardTestingService {
  private static instance: ForwardTestingService;
  private activeSessions: Map<string, ForwardTestingSession> = new Map();
  private signalProcessor: SignalProcessor;
  private executionIntervals: Map<string, NodeJS.Timeout> = new Map();
  private consoleLogInterval: NodeJS.Timeout | null = null;

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
      
      console.log('🚀 Starting LIVE TRADING session:', sessionId);
      console.log('📊 Strategy:', strategy.strategy_name);
      console.log('🏦 OANDA Account:', config.accountId);
      console.log('🌍 Environment:', config.environment);
      console.log('⚡ CRITICAL: This will execute REAL trades automatically');

      // Configure console logger FIRST
      ConsoleLogger.setConfiguration(config, strategy);

      // Initialize the signal processor with trade bridge - CRITICAL FOR TRADE EXECUTION
      console.log('🔧 Initializing trade bridge for REAL trading...');
      const bridgeInitialized = await this.signalProcessor.initializeTradeBridge(config.strategyId);
      if (!bridgeInitialized) {
        throw new Error('❌ CRITICAL: Failed to initialize trade bridge - NO TRADES WILL EXECUTE');
      }
      console.log('✅ Trade bridge initialized - LIVE TRADING READY');

      const session: ForwardTestingSession = {
        id: sessionId,
        strategyId: config.strategyId,
        accountId: config.accountId,
        apiKey: config.apiKey,
        environment: config.environment,
        enabled: config.enabled,
        startTime: new Date().toISOString()
      };

      this.activeSessions.set(sessionId, session);

      // Save session to trading_sessions table
      await supabase.from('trading_sessions').upsert({
        id: sessionId,
        user_id: user.id,
        strategy_id: config.strategyId,
        oanda_account_id: config.accountId,
        oanda_api_key: config.apiKey,
        environment: config.environment,
        is_active: config.enabled,
        strategy_code: strategy.strategy_code,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        last_execution: new Date().toISOString()
      });

      // Start execution loop IMMEDIATELY - this is what executes actual trades
      console.log('🎯 Starting LIVE TRADE execution loop...');
      await this.startExecutionLoop(sessionId, strategy);

      // Start console logging cycle for monitoring
      this.startConsoleLogging();

      console.log('✅ LIVE TRADING session started successfully');
      console.log('🚨 SYSTEM IS NOW LIVE - Will execute real trades based on strategy signals');
      console.log('📊 Check console every 30 seconds for trade evaluation updates');
      
      // Log the start event
      await supabase.from('trading_logs').insert({
        user_id: user.id,
        session_id: sessionId,
        log_type: 'info',
        message: `LIVE TRADING STARTED: ${strategy.strategy_name} on ${strategy.symbol}`,
        trade_data: {
          session_start: {
            strategy_name: strategy.strategy_name,
            symbol: strategy.symbol,
            environment: config.environment,
            timestamp: new Date().toISOString(),
            live_trading: true
          }
        } as any
      });

    } catch (error) {
      console.error('❌ CRITICAL: Failed to start live trading:', error);
      throw error;
    }
  }

  private startConsoleLogging(): void {
    if (this.consoleLogInterval) {
      clearInterval(this.consoleLogInterval);
    }

    console.log('📝 Starting console monitoring - updates every 30 seconds');
    
    // Start immediate logging
    setTimeout(() => {
      ConsoleLogger.runConsoleLogCycle();
    }, 2000);

    // Set up periodic console logging every 30 seconds for better monitoring
    this.consoleLogInterval = setInterval(() => {
      ConsoleLogger.runConsoleLogCycle();
    }, 30 * 1000);
  }

  private stopConsoleLogging(): void {
    if (this.consoleLogInterval) {
      clearInterval(this.consoleLogInterval);
      this.consoleLogInterval = null;
      console.log('🛑 Console monitoring stopped');
    }
    ConsoleLogger.clearConfiguration();
  }

  async stopForwardTesting(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🛑 STOPPING LIVE TRADING - No more automatic trades will be executed');

      // Stop console logging
      this.stopConsoleLogging();

      // Clear execution intervals - CRITICAL to stop trade execution
      this.executionIntervals.forEach((interval, sessionId) => {
        clearInterval(interval);
        console.log(`⏹️ Stopped trade execution for session: ${sessionId}`);
      });
      this.executionIntervals.clear();

      // Clear active sessions
      this.activeSessions.clear();

      // Update database
      await supabase
        .from('trading_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_active', true);

      console.log('✅ LIVE TRADING STOPPED - System is now safe');
    } catch (error) {
      console.error('❌ Error stopping live trading:', error);
    }
  }

  private async startExecutionLoop(sessionId: string, strategy: StrategySettings): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.enabled) {
      console.log(`❌ Session ${sessionId} not active - cannot start execution`);
      return;
    }

    console.log(`🎯 Starting LIVE TRADE execution loop for: ${sessionId}`);
    console.log(`📊 Strategy: ${strategy.strategy_name} on ${strategy.symbol}`);

    const executeTradeCheck = async () => {
      if (!this.activeSessions.has(sessionId)) {
        console.log(`⏹️ Session ${sessionId} ended - stopping trade execution`);
        const interval = this.executionIntervals.get(sessionId);
        if (interval) {
          clearInterval(interval);
          this.executionIntervals.delete(sessionId);
        }
        return;
      }

      try {
        const now = new Date().toLocaleTimeString();
        console.log(`🔍 [${now}] EXECUTING LIVE TRADE CHECK for ${strategy.strategy_name}`);
        
        // CRITICAL: This is where actual trades are evaluated and executed
        await this.checkAndExecuteSignals(session, strategy);
        
      } catch (error) {
        console.error(`❌ [${new Date().toLocaleTimeString()}] TRADE EXECUTION ERROR:`, error);
      }
    };

    // Execute immediately first time
    console.log(`🚀 Executing IMMEDIATE trade check for: ${sessionId}`);
    await executeTradeCheck();

    // Schedule regular executions every 30 seconds for faster signal detection
    const interval = setInterval(executeTradeCheck, 30 * 1000);
    this.executionIntervals.set(sessionId, interval);

    console.log(`⏰ LIVE TRADING scheduled every 30 seconds for: ${sessionId}`);
    console.log(`🚨 SYSTEM IS LIVE - Real trades will be executed automatically`);
  }

  private async checkAndExecuteSignals(session: ForwardTestingSession, strategy: StrategySettings): Promise<void> {
    try {
      const now = new Date().toLocaleTimeString();
      console.log(`📈 [${now}] Analyzing ${strategy.strategy_name} for LIVE TRADE signals`);

      // Convert symbol to OANDA format
      const oandaSymbol = OANDAMarketDataService.convertSymbolToOANDA(strategy.symbol);
      console.log(`🔄 Fetching LIVE data for: ${oandaSymbol}`);

      // Fetch latest market data
      const marketData = await OANDAMarketDataService.fetchLiveMarketData(
        session.accountId,
        session.apiKey,
        session.environment,
        oandaSymbol,
        'M1',
        100
      );

      console.log(`📊 Received ${marketData.close.length} data points for analysis`);
      const currentPrice = marketData.close[marketData.close.length - 1];
      console.log(`💰 Current ${strategy.symbol} price: ${currentPrice}`);

      // Execute strategy logic
      console.log(`🧠 Running strategy algorithm...`);
      const strategyResult = await PythonExecutor.executeStrategy(
        strategy.strategy_code,
        marketData
      );

      // Check latest signals
      const latestIndex = marketData.close.length - 1;
      const hasEntry = strategyResult.entry && strategyResult.entry[latestIndex];
      const direction = strategyResult.direction && strategyResult.direction[latestIndex];
      
      console.log(`🔍 Signal Analysis Result:`, {
        hasEntry: !!hasEntry,
        direction: direction || 'NONE',
        currentPrice,
        timestamp: new Date().toISOString()
      });

      // CRITICAL: Process signal for LIVE TRADE execution
      if (hasEntry && direction && (direction === 'BUY' || direction === 'SELL')) {
        console.log(`🚨 🚨 🚨 LIVE TRADE SIGNAL DETECTED 🚨 🚨 🚨`);
        console.log(`🎯 Action: ${direction} ${strategy.symbol} at ${currentPrice}`);

        const signal = {
          signal: direction as 'BUY' | 'SELL',
          symbol: strategy.symbol,
          currentPrice: currentPrice,
          timestamp: new Date().toISOString(),
          confidence: 0.8,
          strategyName: strategy.strategy_name
        };

        console.log(`⚡ EXECUTING LIVE TRADE via SignalProcessor...`);
        
        // CRITICAL: Execute the LIVE TRADE through signal processor
        const result = await this.signalProcessor.processSignal(signal);
        
        if (result.tradeExecuted) {
          console.log('✅ ✅ ✅ LIVE TRADE EXECUTED SUCCESSFULLY! ✅ ✅ ✅');
          console.log(`💰 Trade details: ${direction} ${strategy.symbol} at ${currentPrice}`);
        } else {
          console.log('❌ ❌ ❌ LIVE TRADE EXECUTION FAILED ❌ ❌ ❌');
          console.log(`🔧 Reason: ${result.message}`);
        }

        // Update session execution time
        session.lastExecutionTime = new Date().toISOString();
        await supabase
          .from('trading_sessions')
          .update({ last_execution: session.lastExecutionTime })
          .eq('id', session.id);
          
      } else {
        console.log(`📊 [${now}] No trade signals - continuing to monitor...`);
        console.log(`🔍 Entry: ${!!hasEntry}, Direction: ${direction || 'NONE'}`);
        
        // Log monitoring activity every 10th check to avoid spam
        if (Math.random() < 0.1) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('trading_logs').insert({
              user_id: user.id,
              session_id: session.id,
              log_type: 'info',
              message: `LIVE MONITORING: No signals for ${strategy.symbol} at ${currentPrice}`,
              trade_data: {
                monitoring: {
                  strategy_name: strategy.strategy_name,
                  symbol: strategy.symbol,
                  current_price: currentPrice,
                  has_entry: hasEntry,
                  direction: direction,
                  timestamp: new Date().toISOString(),
                  live_trading: true
                }
              } as any
            });
          }
        }
      }

    } catch (error) {
      console.error(`❌ [${new Date().toLocaleTimeString()}] LIVE TRADE CHECK ERROR:`, error);
      
      // Log the error
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('trading_logs').insert({
          user_id: user.id,
          session_id: session.id,
          log_type: 'error',
          message: `LIVE TRADE ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
          trade_data: {
            error_details: String(error),
            timestamp: new Date().toISOString(),
            live_trading: true
          } as any
        });
      }
    }
  }

  async getActiveSessions(): Promise<ForwardTestingSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return Array.from(this.activeSessions.values());

      // Get active sessions from database and restore them
      const { data: dbSessions } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (dbSessions && dbSessions.length > 0) {
        for (const dbSession of dbSessions) {
          if (!this.activeSessions.has(dbSession.id)) {
            const session: ForwardTestingSession = {
              id: dbSession.id,
              strategyId: dbSession.strategy_id,
              accountId: dbSession.oanda_account_id,
              apiKey: dbSession.oanda_api_key,
              environment: dbSession.environment as 'practice' | 'live',
              enabled: dbSession.is_active,
              startTime: dbSession.created_at
            };
            this.activeSessions.set(dbSession.id, session);
            
            // Restart execution loop for restored session
            if (session.enabled) {
              const strategy = {
                id: dbSession.strategy_id,
                strategy_name: dbSession.strategy_id,
                strategy_code: dbSession.strategy_code,
                symbol: dbSession.symbol,
                timeframe: dbSession.timeframe
              } as StrategySettings;
              
              console.log(`♻️ Restored and restarting LIVE TRADING session: ${dbSession.id}`);
              await this.startExecutionLoop(dbSession.id, strategy);
            }
          }
        }
      }

      return Array.from(this.activeSessions.values());
    } catch (error) {
      console.error('Error syncing active sessions:', error);
      return Array.from(this.activeSessions.values());
    }
  }

  async getForwardTestingStats(): Promise<ForwardTestingStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          totalTrades: 0,
          successfulTrades: 0,
          failedTrades: 0
        };
      }

      // Get stats from trading_logs
      const { data: logs } = await supabase
        .from('trading_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      const totalTrades = logs?.filter(log => log.log_type === 'trade_execution').length || 0;
      const successfulTrades = logs?.filter(log => 
        log.log_type === 'trade_execution' && 
        log.message.includes('successfully')
      ).length || 0;
      const failedTrades = logs?.filter(log => 
        log.log_type === 'error'
      ).length || 0;
      
      const lastExecution = logs?.[0]?.timestamp;

      return {
        totalTrades,
        successfulTrades,
        failedTrades,
        lastExecution
      };
    } catch (error) {
      console.error('❌ Error getting forward testing stats:', error);
      return {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0
      };
    }
  }
}
