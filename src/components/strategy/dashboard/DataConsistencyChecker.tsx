
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw, BarChart3 } from 'lucide-react';
import { DataConsistencyService, type ConsistencyReport } from '@/services/dataConsistencyService';
import { useToast } from '@/hooks/use-toast';

interface DataConsistencyCheckerProps {
  strategy?: any;
  oandaConfig?: any;
}

const DataConsistencyChecker: React.FC<DataConsistencyCheckerProps> = ({
  strategy,
  oandaConfig
}) => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [report, setReport] = useState<ConsistencyReport | null>(null);

  const handleCheckConsistency = async () => {
    if (!strategy || !oandaConfig?.accountId || !oandaConfig?.apiKey) {
      toast({
        title: "⚠️ Configuration Required",
        description: "Please configure your strategy and OANDA connection first",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    try {
      const consistencyReport = await DataConsistencyService.validateDataConsistency({
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        lookbackPeriods: 100,
        oandaConfig: {
          accountId: oandaConfig.accountId,
          apiKey: oandaConfig.apiKey,
          environment: oandaConfig.environment
        }
      });

      setReport(consistencyReport);

      toast({
        title: consistencyReport.isConsistent ? "✅ Data Consistency Good" : "⚠️ Data Inconsistency Detected",
        description: `Data difference: ${consistencyReport.dataDifference.toFixed(2)}%`,
        variant: consistencyReport.isConsistent ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Consistency check failed:', error);
      toast({
        title: "❌ Consistency Check Failed",
        description: error.message || "Could not validate data consistency",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = () => {
    if (!report) return null;

    return (
      <Badge 
        variant={report.isConsistent ? "default" : "destructive"}
        className={report.isConsistent ? "bg-emerald-600" : "bg-red-600"}
      >
        {report.isConsistent ? (
          <CheckCircle className="h-3 w-3 mr-1" />
        ) : (
          <AlertTriangle className="h-3 w-3 mr-1" />
        )}
        {report.isConsistent ? 'Consistent' : 'Inconsistent'}
      </Badge>
    );
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-sm text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Data Consistency
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">
            {strategy ? `${strategy.symbol} - ${strategy.timeframe}` : 'No strategy selected'}
          </span>
          <Button
            onClick={handleCheckConsistency}
            disabled={isChecking || !strategy || !oandaConfig?.accountId}
            size="sm"
            variant="outline"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Check
              </>
            )}
          </Button>
        </div>

        {report && (
          <div className="space-y-3 pt-3 border-t border-slate-700">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Data Difference:</span>
              <span className={`text-sm font-medium ${report.isConsistent ? 'text-emerald-400' : 'text-red-400'}`}>
                {report.dataDifference.toFixed(2)}%
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-slate-400">Recommendations:</span>
              <div className="space-y-1">
                {report.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 bg-slate-900/30 p-2 rounded">
          💡 This checks if your backtest data matches live OANDA data for better trading accuracy
        </div>
      </CardContent>
    </Card>
  );
};

export default DataConsistencyChecker;
