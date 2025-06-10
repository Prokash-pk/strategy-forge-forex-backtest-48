
import React from 'react';

export interface DiagnosticItem {
  id: string;
  category: 'python' | 'strategy' | 'oanda' | 'server' | 'trading' | 'system';
  name: string;
  status: 'checking' | 'pass' | 'warning' | 'fail';
  message: string;
  critical: boolean;
  solution?: string;
  icon: React.ReactNode;
}

export interface GroupedDiagnostics {
  python: DiagnosticItem[];
  strategy: DiagnosticItem[];
  oanda: DiagnosticItem[];
  server: DiagnosticItem[];
  trading: DiagnosticItem[];
  system: DiagnosticItem[];
}

export type OverallStatus = 'checking' | 'ready' | 'warning' | 'critical';
