
import { DiagnosticItem, OverallStatus } from './types';

export class DiagnosticUtils {
  static calculateOverallStatus(diagnostics: DiagnosticItem[]): OverallStatus {
    const criticalFailures = diagnostics.filter(r => r.critical && r.status === 'fail');
    const warnings = diagnostics.filter(r => r.status === 'warning');
    
    if (criticalFailures.length > 0) {
      return 'critical';
    } else if (warnings.length > 0) {
      return 'warning';
    } else {
      return 'ready';
    }
  }

  static groupDiagnostics(diagnostics: DiagnosticItem[]) {
    return {
      python: diagnostics.filter(d => d.category === 'python'),
      strategy: diagnostics.filter(d => d.category === 'strategy'),
      oanda: diagnostics.filter(d => d.category === 'oanda'),
      server: diagnostics.filter(d => d.category === 'server'),
      trading: diagnostics.filter(d => d.category === 'trading'),
      system: diagnostics.filter(d => d.category === 'system')
    };
  }
}
