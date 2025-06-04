
import React from 'react';

export interface DiagnosticResult {
  name: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
  iconType: 'user' | 'settings' | 'wifi' | 'zap' | 'server' | 'database' | 'activity';
  category: 'auth' | 'config' | 'connectivity' | 'forward_testing';
}

export interface DiagnosticStats {
  successCount: number;
  warningCount: number;
  errorCount: number;
}
