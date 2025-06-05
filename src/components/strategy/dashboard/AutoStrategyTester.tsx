import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AutoStrategyTester } from '@/services/autoTesting/autoStrategyTester';
import { TestTube, Play, Square, Timer, Eye } from 'lucide-react';

interface AutoStrategyTesterProps {
  strategy: any;
  oandaConfig: any;
  isConfigured: boolean;
}

const AutoStrategyTesterComponent: React.FC<AutoStrategyTesterProps> = ({
  strategy,
  oandaConfig,
  isConfigured
}) => {
  const { toast } = useToast();
  const [isTestingActive, setIsTestingActive] = useState(false);
  const [testInterval, setTestInterval] = useState(30);
  const [testCount, setTestCount] = useState(0);

  const autoTester = AutoStrategyTester.getInstance();

  useEffect(() => {
    const status = autoTester.getStatus();
    setIsTestingActive(status.isRunning);
  }, []);

  const handleStartTesting = async () => {
    if (!isConfigured || !strategy || !oandaConfig.accountId) {
      toast({
        title: "Configuration Required",
        description: "Please ensure strategy and OANDA configuration are complete",
        variant: "destructive",
      });
      return;
    }

    try {
      await autoTester.startAutoTesting(oandaConfig, strategy, testInterval);
      setIsTestingActive(true);
      setTestCount(0);
      
      toast({
        title: "🧪 Auto-Testing Started!",
        description: `Testing strategy every ${testInterval} seconds - check console for detailed logs`,
      });

      // Count tests
      const countInterval = setInterval(() => {
        if (autoTester.isActive()) {
          setTestCount(prev => prev + 1);
        } else {
          clearInterval(countInterval);
        }
      }, testInterval * 1000);

    } catch (error) {
      toast({
        title: "Failed to Start Testing",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleStopTesting = () => {
    autoTester.stopAutoTesting();
    setIsTestingActive(false);
    
    toast({
      title: "🛑 Auto-Testing Stopped",
      description: "Strategy testing has been stopped",
    });
  };

  const handleRunSingleTest = async () => {
    if (!isConfigured || !strategy || !oandaConfig.accountId) {
      toast({
        title: "Configuration Required", 
        description: "Please ensure strategy and OANDA configuration are complete",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the private method via a single test
      await autoTester.startAutoTesting(oandaConfig, strategy, 999999); // Very long interval
      setTimeout(() => {
        autoTester.stopAutoTesting();
      }, 1000); // Stop after 1 second
      
      toast({
        title: "🔍 Single Test Executed",
        description: "Check console for detailed strategy analysis",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TestTube className="h-5 w-5" />
          Auto Strategy Tester
          {isTestingActive && (
            <Badge variant="default" className="bg-blue-600">
              <Eye className="h-3 w-3 mr-1" />
              Testing Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-interval" className="text-white">Test Interval (seconds)</Label>
              <Input
                id="test-interval"
                type="number"
                value={testInterval}
                onChange={(e) => setTestInterval(Number(e.target.value))}
                min={10}
                max={300}
                disabled={isTestingActive}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400">How often to test strategy signals</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Test Statistics</Label>
              <div className="bg-slate-700/50 p-3 rounded">
                <div className="text-sm text-slate-300">
                  Total Tests: {testCount}
                </div>
                <div className="text-xs text-slate-400">
                  Status: {isTestingActive ? 'Running' : 'Stopped'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          {!isTestingActive ? (
            <Button
              onClick={handleStartTesting}
              disabled={!isConfigured}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Auto Testing
            </Button>
          ) : (
            <Button
              onClick={handleStopTesting}
              className="bg-red-600 hover:bg-red-700"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Testing
            </Button>
          )}

          <Button
            onClick={handleRunSingleTest}
            disabled={!isConfigured || isTestingActive}
            variant="outline"
            className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Run Single Test
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Eye className="h-4 w-4 text-blue-400 mt-0.5" />
            <div>
              <p className="text-blue-300 text-sm font-medium">
                Console Monitoring Active
              </p>
              <p className="text-blue-400 text-xs mt-1">
                Open your browser's Developer Tools (F12) and check the Console tab to see detailed strategy testing logs including:
              </p>
              <ul className="text-blue-400 text-xs mt-2 space-y-1 ml-4">
                <li>• Live market data (OHLCV candles)</li>
                <li>• Strategy signal detection (BUY/SELL)</li>
                <li>• Technical indicator values (RSI, EMA, MACD)</li>
                <li>• Signal confidence levels</li>
                <li>• Real-time trade opportunities</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Configuration Warning */}
        {!isConfigured && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-yellow-300 text-sm">
              ⚠️ Strategy and OANDA configuration required before testing
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoStrategyTesterComponent;
