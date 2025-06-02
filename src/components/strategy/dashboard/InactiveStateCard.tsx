
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const InactiveStateCard: React.FC = () => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-12 text-center">
        <AlertCircle className="h-16 w-16 text-slate-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Forward Testing Inactive</h3>
        <p className="text-slate-400">
          Please start forward testing to view positions and trade logs.
        </p>
      </CardContent>
    </Card>
  );
};

export default InactiveStateCard;
