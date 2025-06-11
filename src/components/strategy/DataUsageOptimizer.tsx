
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Database, Zap, Clock, HardDrive, RefreshCw } from 'lucide-react';
import { DatabaseOptimizer } from '@/services/databaseOptimizer';
import { OptimizedAutoStrategyTester } from '@/services/autoTesting/optimizedAutoStrategyTester';
import { useToast } from '@/hooks/use-toast';

const DataUsageOptimizer: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [optimizationStatus, setOptimizationStatus] = useState<any>(null);
  const { toast } = useToast();

  const loadCacheStats = () => {
    if (typeof window !== 'undefined' && (window as any).getCacheStats) {
      const stats = (window as any).getCacheStats();
      setCacheStats(stats);
    }
  };

  useEffect(() => {
    loadCacheStats();
    const interval = setInterval(loadCacheStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    try {
      console.log('🔧 Running data usage optimization...');
      
      // Archive old logs
      const archivedLogs = await DatabaseOptimizer.archiveOldTradingLogs(7);
      
      // Cleanup inactive sessions
      const cleanedSessions = await DatabaseOptimizer.cleanupInactiveSessions(1);
      
      // Clear market data cache
      if (typeof window !== 'undefined' && (window as any).clearMarketDataCache) {
        (window as any).clearMarketDataCache();
      }
      
      setOptimizationStatus({
        archivedLogs,
        cleanedSessions,
        timestamp: new Date().toLocaleString()
      });
      
      toast({
        title: "🔧 Optimization Complete",
        description: `Archived ${archivedLogs} logs, cleaned ${cleanedSessions} sessions`,
      });
      
      loadCacheStats();
      
    } catch (error) {
      console.error('❌ Optimization failed:', error);
      toast({
        title: "❌ Optimization Failed",
        description: "Could not complete database optimization",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined' && (window as any).clearMarketDataCache) {
      (window as any).clearMarketDataCache();
      loadCacheStats();
      toast({
        title: "🗑️ Cache Cleared",
        description: "Market data cache has been cleared",
      });
    }
  };

  const handleSetTestFrequency = (minutes: number) => {
    if (typeof window !== 'undefined' && (window as any).setTestFrequency) {
      (window as any).setTestFrequency(minutes);
      toast({
        title: "⏰ Frequency Updated",
        description: `Test frequency set to ${minutes} minutes`,
      });
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Database className="h-5 w-5" />
          Data Usage Optimizer
          <Badge variant="secondary" className="bg-blue-600">
            Cost Reduction
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Current Cache Status */}
        <div className="p-3 bg-slate-900/50 rounded border border-slate-600">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Cache Status
          </h4>
          <div className="text-sm text-slate-400 space-y-1">
            <div>Cache Entries: <span className="text-white">{cacheStats?.cacheSize || 0}</span></div>
            <div>Last Executions: <span className="text-white">{cacheStats?.lastExecutions?.length || 0}</span></div>
            <div>Status: <span className="text-emerald-400">Active Caching</span></div>
          </div>
        </div>

        {/* Optimization Controls */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Optimization Actions</h4>
          
          <Button
            onClick={handleRunOptimization}
            disabled={isOptimizing}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Optimizing Database...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Run Database Optimization
              </>
            )}
          </Button>

          <Button
            onClick={handleClearCache}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:text-white"
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Clear Market Data Cache
          </Button>
        </div>

        <Separator className="bg-slate-600" />

        {/* Test Frequency Controls */}
        <div className="space-y-3">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Test Frequency (Reduce for Lower Data Usage)
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleSetTestFrequency(15)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:text-white"
            >
              15 min
            </Button>
            <Button
              onClick={() => handleSetTestFrequency(30)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:text-white"
            >
              30 min
            </Button>
            <Button
              onClick={() => handleSetTestFrequency(60)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:text-white"
            >
              1 hour
            </Button>
            <Button
              onClick={() => handleSetTestFrequency(120)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:text-white"
            >
              2 hours
            </Button>
          </div>
        </div>

        {/* Optimization Results */}
        {optimizationStatus && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <h4 className="text-emerald-400 font-medium mb-2">Last Optimization Results</h4>
            <div className="text-sm text-emerald-300 space-y-1">
              <div>Archived Logs: {optimizationStatus.archivedLogs}</div>
              <div>Cleaned Sessions: {optimizationStatus.cleanedSessions}</div>
              <div>Completed: {optimizationStatus.timestamp}</div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-slate-500 bg-slate-900/30 p-3 rounded">
          <div className="mb-2 font-medium">💡 Data Usage Tips:</div>
          <ul className="space-y-1">
            <li>• Market data is cached for 5 minutes to reduce API calls</li>
            <li>• Tests are throttled to run maximum every 10 minutes per symbol</li>
            <li>• Old trading logs are automatically archived weekly</li>
            <li>• Use longer test frequencies (30min+) for major cost savings</li>
            <li>• Database optimization should be run weekly</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataUsageOptimizer;
