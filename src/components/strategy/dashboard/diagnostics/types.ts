
import React from 'react';

export interface DiagnosticResult {
  name: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
  icon: React.ReactNode;
  category: 'auth' | 'config' | 'connectivity' | 'forward_testing';
}

export interface DiagnosticStats {
  successCount: number;
  warningCount: number;
  errorCount: number;
}
