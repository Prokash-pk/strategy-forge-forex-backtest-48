import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { supabase } from '@/integrations/supabase/client';

interface ForwardTestingSessionFixerProps {
  selectedStrategy: any;
  onSessionsCleaned: () => void;
}

const ForwardTestingSessionFixer: React.FC<ForwardTestingSessionFixerProps> = ({
  selectedStrategy,
  onSessionsCleaned
}) => {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = React.useState(false);

  const handleCleanOldSessions = async () => {
    setIsFixing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Stop all active sessions by calling the server-side function
      await ServerForwardTestingService.stopServerSideForwardTesting(user.id);
      
      toast({
        title: "Old Sessions Cleaned",
        description: "Stopped all active sessions. You can now start fresh with your current strategy.",
      });
      
      onSessionsCleaned();
    } catch (error) {
      console.error('Failed to clean sessions:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to clean old sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="bg-amber-500/10 border-amber-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="h-5 w-5" />
          Session Mismatch Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-amber-300 text-sm">
          <p>Active server sessions don't match your current strategy:</p>
          <p className="font-medium mt-2">Current Strategy: {selectedStrategy?.strategy_name || 'None'}</p>
          <p className="text-xs mt-2">
            This happens when you change strategies while forward testing is active. 
            The old sessions need to be stopped before starting with the new strategy.
          </p>
        </div>
        
        <Button
          onClick={handleCleanOldSessions}
          disabled={isFixing}
          className="bg-amber-600 hover:bg-amber-700 text-white"
          size="sm"
        >
          {isFixing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Cleaning Sessions...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Clean Old Sessions
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ForwardTestingSessionFixer;
