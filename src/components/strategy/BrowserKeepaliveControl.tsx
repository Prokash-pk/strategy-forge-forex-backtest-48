
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Coffee, AlertTriangle, CheckCircle, Power } from 'lucide-react';
import { BrowserKeepalive } from '@/services/browserKeepalive';

const BrowserKeepaliveControl: React.FC = () => {
  const [status, setStatus] = useState(BrowserKeepalive.getInstance().getStatus());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(BrowserKeepalive.getInstance().getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleKeepalive = async () => {
    setIsLoading(true);
    try {
      const keepalive = BrowserKeepalive.getInstance();
      
      if (status.isActive) {
        keepalive.stopKeepalive();
      } else {
        await keepalive.startKeepalive();
      }
      
      // Update status immediately
      setTimeout(() => {
        setStatus(keepalive.getStatus());
      }, 100);
    } catch (error) {
      console.error('Error toggling browser keepalive:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Browser Keepalive Control
          </div>
          <div className="flex items-center gap-2">
            {status.isActive ? (
              <Badge variant="default" className="bg-emerald-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-600">
                <Power className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-slate-900 rounded-lg">
          <div className="flex items-start gap-3">
            <Coffee className="h-5 w-5 text-emerald-400 mt-0.5" />
            <div>
              <h4 className="text-white font-medium mb-2">24/7 Trading Mode</h4>
              <p className="text-slate-400 text-sm mb-3">
                Prevents your browser and computer from sleeping during active trading sessions.
                Essential for uninterrupted strategy execution.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${status.hasWakeLock ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                  <span className="text-xs text-slate-400">Screen Lock</span>
                </div>
                <div className="text-center">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${status.hasAudioContext ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                  <span className="text-xs text-slate-400">Audio Context</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleToggleKeepalive}
          disabled={isLoading}
          className={`w-full ${
            status.isActive 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isLoading ? (
            'Processing...'
          ) : status.isActive ? (
            <>
              <Power className="h-4 w-4 mr-2" />
              Stop Keepalive
            </>
          ) : (
            <>
              <Coffee className="h-4 w-4 mr-2" />
              Start Keepalive
            </>
          )}
        </Button>

        {status.isActive && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Browser Keepalive Active</span>
            </div>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Screen will stay on</li>
              <li>• Browser tab will remain active</li>
              <li>• Activity simulation running</li>
              <li>• Page unload protection enabled</li>
            </ul>
          </div>
        )}

        {!status.isActive && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-amber-400 font-medium">Keepalive Disabled</span>
            </div>
            <p className="text-slate-400 text-sm">
              Your browser may sleep or throttle background tabs, potentially interrupting trading.
              Enable keepalive for 24/7 operation.
            </p>
          </div>
        )}

        <div className="text-xs text-slate-500 space-y-1">
          <p><strong>Note:</strong> Automatically starts when forward testing begins.</p>
          <p>For best results, keep this browser tab active and your computer plugged in.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrowserKeepaliveControl;
