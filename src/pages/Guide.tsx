
import React from 'react';
import HowItWorksGuide from '@/components/guide/HowItWorksGuide';
import UserMenu from '@/components/UserMenu';

const Guide = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0idXJsKCNncmFkaWVudDApIi8+CjxwYXRoIGQ9Ik04IDIwSDI0TDE2IDEyTDggMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNOCAxMkgyNEwxNiAyMEw4IDEyWiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNyIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDAiIHgxPSIwIiB5MT0iMCIgeDI9IjMyIiB5Mj0iMzIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzEwQjk4MSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwRDlDODgiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K" 
              alt="Stratyx Logo" 
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                Stratyx Guide
              </h1>
              <p className="text-slate-400 mt-2">
                Learn how to build profitable trading strategies
              </p>
            </div>
          </div>
          <UserMenu />
        </div>

        <HowItWorksGuide />
      </div>
    </div>
  );
};

export default Guide;
