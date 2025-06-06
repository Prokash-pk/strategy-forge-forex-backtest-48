
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
      
      console.log('🚀 Starting forward testing session:', sessionId);
      console.log('📊 Strategy:', strategy.strategy_name);
      console.log('🏦 OANDA Account:', config.accountId);
      console.log('🌍 Environment:', config.environment);

      // Configure console logger
      ConsoleLogger.setConfiguration(config, strategy);

      // Initialize the signal processor with trade bridge
      const bridgeInitialized = await this.signalProcessor.initializeTradeBridge(config.strategyId);
      if (!bridgeInitialized) {
        throw new Error('Failed to initialize trade bridge - check OANDA configuration');
      }

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

      // Start console logging cycle
      this.startConsoleLogging();

      console.log('✅ Forward testing session started successfully');
      console.log('🤖 Trade execution is now LIVE - signals will be converted to real trades');
      console.log('📝 Console logging active - check console every minute for strategy evaluation');
      
      // Start the execution loop immediately
      await this.startExecutionLoop(sessionId, strategy);

      // Log the start event
      await supabase.from('trading_logs').insert({
        user_id: user.id,
        session_id: sessionId,
        log_type: 'info',
        message: `Forward testing started for strategy: ${strategy.strategy_name}`,
        trade_data: {
          session_start: {
            strategy_name: strategy.strategy_name,
            symbol: strategy.symbol,
            environment: config.environment,
            timestamp: new Date().toISOString()
          }
        } as any
      });

    } catch (error) {
      console.error('❌ Failed to start forward testing:', error);
      throw error;
    }
  }

  private startConsoleLogging(): void {
    if (this.consoleLogInterval) {
      clearInterval(this.consoleLogInterval);
    }

    console.log('📝 Starting console logging cycle - updates every 60 seconds');
    
    // Start immediate logging
    setTimeout(() => {
      ConsoleLogger.runConsoleLogCycle();
    }, 2000); // Give 2 seconds for initialization

    // Set up periodic console logging every 1 minute
    this.consoleLogInterval = setInterval(() => {
      ConsoleLogger.runConsoleLogCycle();
    }, 60 * 1000); // Every 60 seconds
  }

  private stopConsoleLogging(): void {
    if (this.consoleLogInterval) {
      clearInterval(this.consoleLogInterval);
      this.consoleLogInterval = null;
      console.log('🛑 Console logging stopped');
    }
    ConsoleLogger.clearConfiguration();
  }

  async stopForwardTesting(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🛑 Stopping all forward testing sessions...');

      // Stop console logging
      this.stopConsoleLogging();

      // Clear execution intervals
      this.executionIntervals.forEach((interval, sessionId) => {
        clearInterval(interval);
        console.log(`⏹️ Stopped execution interval for session: ${sessionId}`);
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
        const interval = this.executionIntervals.get(sessionId);
        if (interval) {
          clearInterval(interval);
          this.executionIntervals.delete(sessionId);
        }
        return;
      }

      try {
        console.log(`🔍 Checking signals for session: ${sessionId}`);
        await this.checkAndExecuteSignals(session, strategy);
      } catch (error) {
        console.error(`❌ Error in execution loop for ${sessionId}:`, error);
      }
    };

    // Execute immediately first time
    console.log(`🚀 Executing initial signal check for session: ${sessionId}`);
    await executeSignalCheck();

    // Then schedule regular executions every 1 minute for faster testing
    const interval = setInterval(executeSignalCheck, 60 * 1000);
    this.executionIntervals.set(sessionId, interval);

    console.log(`⏰ Execution loop scheduled every 1 minute for session: ${sessionId}`);
  }

  private async checkAndExecuteSignals(session: ForwardTestingSession, strategy: StrategySettings): Promise<void> {
    try {
      console.log(`📈 Checking signals for strategy: ${strategy.strategy_name}`);

      // Convert symbol to OANDA format
      const oandaSymbol = OANDAMarketDataService.convertSymbolToOANDA(strategy.symbol);

      // Fetch latest market data
      const marketData = await OANDAMarketDataService.fetchLiveMarketData(
        session.accountId,
        session.apiKey,
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
          .from('trading_sessions')
          .update({ last_execution: session.lastExecutionTime })
          .eq('id', session.id);
      } else {
        console.log('📊 No trade signals detected - monitoring continues...');
        
        // Log the monitoring activity
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('trading_logs').insert({
            user_id: user.id,
            session_id: session.id,
            log_type: 'info',
            message: `Signal monitoring: No entry signals for ${strategy.symbol} at ${marketData.close[latestIndex]}`,
            trade_data: {
              monitoring: {
                strategy_name: strategy.strategy_name,
                symbol: strategy.symbol,
                current_price: marketData.close[latestIndex],
                has_entry: hasEntry,
                direction: direction,
                timestamp: new Date().toISOString()
              }
            } as any
          });
        }
      }

    } catch (error) {
      console.error('❌ Error checking signals:', error);
      
      // Log the error
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('trading_logs').insert({
          user_id: user.id,
          session_id: session.id,
          log_type: 'trade_error',
          message: `Signal check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          trade_data: {
            error_details: String(error),
            timestamp: new Date().toISOString()
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
              
              console.log(`♻️ Restored and restarting session: ${dbSession.id}`);
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
        log.log_type === 'trade_error'
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
