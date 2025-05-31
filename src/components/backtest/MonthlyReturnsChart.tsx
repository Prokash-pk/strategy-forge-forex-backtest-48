
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyReturnsChartProps {
  monthlyReturns?: any[];
}

const MonthlyReturnsChart: React.FC<MonthlyReturnsChartProps> = ({ monthlyReturns }) => {
  // Use provided data or fallback to sample data
  const chartData = monthlyReturns || [
    { month: 'Jan', return: 2.3 },
    { month: 'Feb', return: -1.2 },
    { month: 'Mar', return: 4.1 },
    { month: 'Apr', return: 1.8 },
    { month: 'May', return: -0.9 },
    { month: 'Jun', return: 3.2 },
    { month: 'Jul', return: 2.7 },
    { month: 'Aug', return: -2.1 },
    { month: 'Sep', return: 1.9 },
    { month: 'Oct', return: 4.8 },
    { month: 'Nov', return: 3.1 },
    { month: 'Dec', return: 2.4 }
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Monthly Returns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="return" 
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyReturnsChart;
