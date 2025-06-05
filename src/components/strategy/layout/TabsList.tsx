
import React from 'react';
import { TabsList as UITabsList, TabsTrigger } from '@/components/ui/tabs';
import { TAB_ITEMS } from './TabConfiguration';

const TabsList: React.FC = () => {
  return (
    <UITabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-slate-800 border-slate-700 h-auto p-1">
      {TAB_ITEMS.map((tab) => (
        <TabsTrigger 
          key={tab.value}
          value={tab.value}
          className="data-[state=active]:bg-emerald-600 flex flex-col items-center gap-1 py-3 px-2 text-xs lg:text-sm"
        >
          <tab.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">{tab.shortLabel}</span>
        </TabsTrigger>
      ))}
    </UITabsList>
  );
};

export default TabsList;
