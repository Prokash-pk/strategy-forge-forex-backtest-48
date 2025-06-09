
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Code, 
  BookOpen, 
  Lightbulb, 
  TrendingUp,
  Users,
  ChartBar
} from 'lucide-react';

const StrategyTabsList: React.FC = () => {
  return (
    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 bg-slate-700 h-auto p-1 gap-1">
      <TabsTrigger value="configuration" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Configuration</span>
        <span className="sm:hidden">Config</span>
      </TabsTrigger>
      <TabsTrigger value="python" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <Code className="h-4 w-4" />
        <span className="hidden sm:inline">Python Code</span>
        <span className="sm:hidden">Code</span>
      </TabsTrigger>
      <TabsTrigger value="saved" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <BookOpen className="h-4 w-4" />
        <span className="hidden sm:inline">Saved</span>
        <span className="sm:hidden">Saved</span>
      </TabsTrigger>
      <TabsTrigger value="visual" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <ChartBar className="h-4 w-4" />
        <span className="hidden sm:inline">Visual Builder</span>
        <span className="sm:hidden">Visual</span>
      </TabsTrigger>
      <TabsTrigger value="oanda" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <TrendingUp className="h-4 w-4" />
        <span className="hidden sm:inline">Live Trading</span>
        <span className="sm:hidden">Live</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default StrategyTabsList;
