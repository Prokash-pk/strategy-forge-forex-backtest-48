
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const InactiveStateCard: React.FC = () => {
  return (
    <Card className="bg-slate-800 border-slate-700 w-full">
      <CardContent className="p-6 sm:p-12 text-center">
        <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Forward Testing Inactive</h3>
        <p className="text-slate-400 text-sm sm:text-base px-4">
          Please start forward testing to view positions and trade logs.
        </p>
      </CardContent>
    </Card>
  );
};

export default InactiveStateCard;
