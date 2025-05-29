
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
  </div>
);

export const EmptyState: React.FC = () => (
  <Card className="bg-slate-700 border-slate-600">
    <CardContent className="p-6 text-center">
      <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
      <p className="text-slate-300 mb-2">No matching strategies found</p>
      <p className="text-slate-400 text-sm">
        Create and test strategies with high win rates (60%+) and good returns (15%+) to see them featured here
      </p>
    </CardContent>
  </Card>
);
