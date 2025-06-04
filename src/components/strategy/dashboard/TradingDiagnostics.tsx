
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { DiagnosticsService } from './diagnostics/diagnosticsService';
import { DiagnosticResults, TradingDiagnosticsProps } from './diagnostics/types';
import DiagnosticHeader from './diagnostics/DiagnosticHeader';
import RootCauseDisplay from './diagnostics/RootCauseDisplay';
import SystemChecksGrid from './diagnostics/SystemChecksGrid';
import IssuesDisplay from './diagnostics/IssuesDisplay';
import RecommendationsDisplay from './diagnostics/RecommendationsDisplay';
import SessionsDisplay from './diagnostics/SessionsDisplay';

const TradingDiagnostics: React.FC<TradingDiagnosticsProps> = ({ strategy }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [comprehensiveResults, setComprehensiveResults] = useState<DiagnosticResults | null>(null);

  const runComprehensiveDiagnostics = async () => {
    setIsLoading(true);
    try {
      const results = await DiagnosticsService.runComprehensiveDiagnostics();
      setComprehensiveResults(results);
    } catch (error: any) {
      console.error('Diagnostics error:', error);
      setComprehensiveResults({
        error: error.message,
        timestamp: new Date().toISOString(),
        checks: {},
        issues: [],
        recommendations: []
      } as any);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-run comprehensive diagnostics on mount
  useEffect(() => {
    runComprehensiveDiagnostics();
  }, []);

  return (
    <Card className="bg-slate-800 border-slate-700 w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          Comprehensive Forward Testing Diagnosis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DiagnosticHeader 
          onRunDiagnostics={runComprehensiveDiagnostics}
          isLoading={isLoading}
        />

        {comprehensiveResults && (
          <div className="space-y-6">
            <RootCauseDisplay rootCause={comprehensiveResults.rootCause} />
            
            <SystemChecksGrid checks={comprehensiveResults.checks} />
            
            <IssuesDisplay issues={comprehensiveResults.issues} />
            
            <RecommendationsDisplay recommendations={comprehensiveResults.recommendations} />
            
            <SessionsDisplay 
              sessions={comprehensiveResults.checks?.serverSessions?.sessions || []}
              logs={comprehensiveResults.checks?.serverLogs?.recentLogs || []}
            />

            <div className="text-xs text-slate-500 pt-2 border-t border-slate-600">
              Last diagnosis: {new Date(comprehensiveResults.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingDiagnostics;
