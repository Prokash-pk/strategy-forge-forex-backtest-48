
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DiagnosticResults } from './types';

interface SessionsDisplayProps {
  sessions: any[];
  logs: any[];
}

const SessionsDisplay: React.FC<SessionsDisplayProps> = ({ sessions, logs }) => {
  return (
    <>
      {/* Server Session Details */}
      {sessions && sessions.length > 0 && (
        <div className="p-4 bg-slate-700/30 rounded-lg">
          <h4 className="text-white text-sm font-medium mb-2">Server Trading Sessions</h4>
          <div className="space-y-2">
            {sessions.map((session: any, index: number) => (
              <div key={index} className="text-xs p-2 bg-slate-600/50 rounded">
                <p className="text-slate-300">
                  Strategy: {session.strategy_name || session.strategy_id}
                </p>
                <p className="text-slate-400">
                  Symbol: {session.symbol} | Environment: {session.environment}
                </p>
                <p className="text-slate-400">
                  Last Execution: {new Date(session.last_execution).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Server Logs */}
      {logs && logs.length > 0 && (
        <div className="p-4 bg-slate-700/30 rounded-lg">
          <h4 className="text-white text-sm font-medium mb-2">Recent Server Activity</h4>
          <div className="space-y-1">
            {logs.map((log: any, index: number) => (
              <div key={index} className="text-xs p-2 bg-slate-600/50 rounded">
                <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}:</span>
                <span className="text-slate-300 ml-2">{log.message}</span>
                {log.log_type === 'trade' && (
                  <Badge variant="default" className="ml-2 text-xs">Trade</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default SessionsDisplay;
