
import React from 'react';
import { DiagnosticResult } from './types';
import DiagnosticItem from './DiagnosticItem';

interface DiagnosticSectionProps {
  title: string;
  items: DiagnosticResult[];
}

const DiagnosticSection: React.FC<DiagnosticSectionProps> = ({ title, items }) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-slate-300 border-b border-slate-600 pb-1">
        {title}
      </h4>
      {items.map((diagnostic, index) => (
        <DiagnosticItem key={index} diagnostic={diagnostic} />
      ))}
    </div>
  );
};

export default DiagnosticSection;
