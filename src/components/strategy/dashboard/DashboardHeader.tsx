
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp } from 'lucide-react';

const DashboardHeader: React.FC = () => {
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-white">
        <TrendingUp className="h-5 w-5" />
        Live Trading Dashboard
        <Badge variant="default" className="bg-emerald-600">
          <Activity className="h-3 w-3 mr-1" />
          Active
        </Badge>
      </CardTitle>
    </CardHeader>
  );
};

export default DashboardHeader;
