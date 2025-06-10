
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Monitor, Play, Activity, Server, BarChart3, Wrench } from 'lucide-react';

const OANDAIntegrationTabs: React.FC = () => {
  return (
    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 bg-slate-700 h-auto p-1 gap-1">
      <TabsTrigger value="config" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Configuration</span>
        <span className="sm:hidden">Config</span>
      </TabsTrigger>
      <TabsTrigger value="strategy" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Strategy</span>
        <span className="sm:hidden">Strategy</span>
      </TabsTrigger>
      <TabsTrigger value="monitor" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <Monitor className="h-4 w-4" />
        <span className="hidden sm:inline">Monitor</span>
        <span className="sm:hidden">Monitor</span>
      </TabsTrigger>
      <TabsTrigger value="control" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <Play className="h-4 w-4" />
        <span className="hidden sm:inline">Control</span>
        <span className="sm:hidden">Control</span>
      </TabsTrigger>
      <TabsTrigger value="keepalive" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <Activity className="h-4 w-4" />
        <span className="hidden sm:inline">Keepalive</span>
        <span className="sm:hidden">Live</span>
      </TabsTrigger>
      <TabsTrigger value="serverside" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <Server className="h-4 w-4" />
        <span className="hidden sm:inline">24/7 Server</span>
        <span className="sm:hidden">24/7</span>
      </TabsTrigger>
      <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Dashboard</span>
        <span className="sm:hidden">Dash</span>
      </TabsTrigger>
      <TabsTrigger value="diagnostic" className="data-[state=active]:bg-slate-600 flex items-center gap-2 py-3 px-2 text-xs lg:text-sm">
        <Wrench className="h-4 w-4" />
        <span className="hidden sm:inline">Diagnostic</span>
        <span className="sm:hidden">Debug</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default OANDAIntegrationTabs;
