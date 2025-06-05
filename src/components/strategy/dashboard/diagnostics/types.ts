
import React from 'react';

export interface DiagnosticResult {
  name: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  details?: any;
  iconType: 'user' | 'settings' | 'wifi' | 'zap' | 'server' | 'database' | 'activity' | 'code' | 'connectivity';
  category: 'auth' | 'config' | 'connectivity' | 'forward_testing';
}

export interface DiagnosticStats {
  successCount: number;
  warningCount: number;
  errorCount: number;
  infoCount?: number;
}
