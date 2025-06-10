
export interface DiagnosticCheck {
  name: string;
  status: 'checking' | 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

export type OverallStatus = 'ready' | 'warning' | 'not-ready';
