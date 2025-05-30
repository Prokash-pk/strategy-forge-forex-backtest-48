
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Play, Code, Eye } from 'lucide-react';

const QuickStart = () => {
  return (
    <Card className="bg-gradient-to-r from-emerald-900/50 to-slate-800 border-emerald-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Play className="h-5 w-5" />
          Ready to Get Started?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-300 mb-4">
          Jump right in with a proven strategy template and start backtesting in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link to="/?tab=strategy">
              <Code className="h-4 w-4 mr-2" />
              Start with Python Strategy
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/?tab=strategy">
              <Eye className="h-4 w-4 mr-2" />
              Try Visual Builder
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStart;
