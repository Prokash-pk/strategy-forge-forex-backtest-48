
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { OverallStatus } from './types';

interface OverallStatusBadgeProps {
  status: OverallStatus;
}

export const OverallStatusBadge: React.FC<OverallStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ready':
      return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Ready for Auto Trading</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" />Ready with Warnings</Badge>;
    default:
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Not Ready</Badge>;
  }
};
