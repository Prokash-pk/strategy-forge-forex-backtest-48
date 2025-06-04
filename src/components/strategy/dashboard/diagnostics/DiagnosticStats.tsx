
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DiagnosticStats } from './types';

interface DiagnosticStatsProps {
  stats: DiagnosticStats;
}

const DiagnosticStatsDisplay: React.FC<DiagnosticStatsProps> = ({ stats }) => {
  return (
    <div className="flex gap-4 mb-6">
      <Badge variant="default" className="bg-emerald-600">
        {stats.successCount} Success
      </Badge>
      <Badge variant="secondary" className="bg-yellow-600">
        {stats.warningCount} Warning
      </Badge>
      <Badge variant="destructive">
        {stats.errorCount} Error
      </Badge>
    </div>
  );
};

export default DiagnosticStatsDisplay;
