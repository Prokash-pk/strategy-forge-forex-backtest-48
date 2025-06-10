
import React from 'react';
import { DiagnosticItem } from './types';
import { getStatusBadge } from './DiagnosticStatusDisplay';

interface DiagnosticSectionProps {
  title: string;
  icon: string;
  items: DiagnosticItem[];
}

const DiagnosticSection: React.FC<DiagnosticSectionProps> = ({ title, icon, items }) => {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-3">{icon} {title}</h3>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-start justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-start gap-3">
              {item.icon}
              <div>
                <div className="font-medium text-white">{item.name}</div>
                <div className="text-sm text-slate-300">{item.message}</div>
                {item.solution && (
                  <div className="text-sm text-blue-300 mt-1">💡 {item.solution}</div>
                )}
              </div>
            </div>
            {getStatusBadge(item.status)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagnosticSection;
