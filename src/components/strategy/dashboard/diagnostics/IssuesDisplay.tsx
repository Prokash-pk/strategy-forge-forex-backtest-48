
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface IssuesDisplayProps {
  issues: string[];
}

const IssuesDisplay: React.FC<IssuesDisplayProps> = ({ issues }) => {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
      <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Issues Detected ({issues.length})
      </h4>
      <ul className="space-y-1">
        {issues.map((issue, index) => (
          <li key={index} className="text-red-300 text-sm">
            • {issue}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IssuesDisplay;
