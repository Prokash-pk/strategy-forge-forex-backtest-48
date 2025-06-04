
export interface DiagnosticCheck {
  status: 'success' | 'warning' | 'error';
  details: string;
  [key: string]: any;
}

export interface DiagnosticResults {
  timestamp: string;
  checks: {
    authentication?: DiagnosticCheck;
    strategyConfig?: DiagnosticCheck;
    oandaConfig?: DiagnosticCheck;
    forwardTestingFlag?: DiagnosticCheck;
    serverSessions?: DiagnosticCheck;
    serverLogs?: DiagnosticCheck;
    databaseSessions?: DiagnosticCheck;
    oandaConnectivity?: DiagnosticCheck;
    edgeFunctions?: DiagnosticCheck;
  };
  issues: string[];
  recommendations: string[];
  rootCause?: {
    primaryIssue: string;
    description: string;
    severity: string;
    action: string;
  };
}

export interface TradingDiagnosticsProps {
  strategy: any;
}
