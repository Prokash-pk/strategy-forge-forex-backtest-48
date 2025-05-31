
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Key, Shield, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OANDAApiGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const OANDAApiGuide: React.FC<OANDAApiGuideProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-800 border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5" />
              OANDA API Setup Guide
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <h3 className="text-amber-400 font-semibold">Important Security Notice</h3>
              <p className="text-slate-300 text-sm mt-1">
                Only use demo accounts for forward testing. Never use your live trading account for automated strategies until thoroughly tested.
              </p>
            </div>
          </div>

          {/* Step 1: Create OANDA Account */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">Step 1</Badge>
              <h3 className="text-white font-semibold">Create OANDA Demo Account</h3>
            </div>
            <div className="ml-4 space-y-2">
              <p className="text-slate-300">
                First, you need to create a free OANDA demo account if you don't have one.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-600 text-slate-300"
                onClick={() => window.open('https://www.oanda.com/demo-account/tpa/personal_info', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Create Demo Account
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-600" />

          {/* Step 2: Generate API Token */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">Step 2</Badge>
              <h3 className="text-white font-semibold">Generate API Token</h3>
            </div>
            <div className="ml-4 space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Log into your OANDA account</li>
                <li>Go to "Manage API Access" in your account settings</li>
                <li>Click "Generate" to create a new Personal Access Token</li>
                <li>Copy the token immediately (you won't be able to see it again)</li>
              </ol>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-600 text-slate-300"
                onClick={() => window.open('https://www.oanda.com/account/tpa/personal_token', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage API Access
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-600" />

          {/* Step 3: Find Account ID */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">Step 3</Badge>
              <h3 className="text-white font-semibold">Find Your Account ID</h3>
            </div>
            <div className="ml-4 space-y-3">
              <p className="text-slate-300">
                Your Account ID is displayed on your OANDA dashboard. It's usually a long number like:
              </p>
              <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-lg">
                <code className="text-emerald-400 flex-1">101-001-12345678-001</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard('101-001-12345678-001', 'account-id')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedStep === 'account-id' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-600" />

          {/* Step 4: API Environment */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">Step 4</Badge>
              <h3 className="text-white font-semibold">Choose API Environment</h3>
            </div>
            <div className="ml-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-emerald-400 font-semibold">Practice (Recommended)</h4>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">Use for testing and development</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-slate-800 p-1 rounded">practice</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('practice', 'env-practice')}
                      className="text-slate-400 hover:text-white h-6 w-6 p-0"
                    >
                      {copiedStep === 'env-practice' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <h4 className="text-red-400 font-semibold">Live (Advanced Only)</h4>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">Real money trading - use with extreme caution</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-slate-800 p-1 rounded">live</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('live', 'env-live')}
                      className="text-slate-400 hover:text-white h-6 w-6 p-0"
                    >
                      {copiedStep === 'env-live' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-600" />

          {/* Step 5: Configuration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">Step 5</Badge>
              <h3 className="text-white font-semibold">Configure in Forward Testing Tab</h3>
            </div>
            <div className="ml-4 space-y-2">
              <p className="text-slate-300">
                Return to the Forward Testing tab and enter your:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 ml-4">
                <li>Account ID (from Step 3)</li>
                <li>API Token (from Step 2)</li>
                <li>Environment (practice or live)</li>
              </ul>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="bg-slate-900 p-4 rounded-lg">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Additional Resources
            </h4>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-300 hover:text-white justify-start p-0"
                onClick={() => window.open('https://developer.oanda.com/rest-live-v20/introduction/', '_blank')}
              >
                OANDA API Documentation
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-300 hover:text-white justify-start p-0"
                onClick={() => window.open('https://www.oanda.com/demo-account/', '_blank')}
              >
                Demo Account Information
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700">
              Got it, Let's Configure!
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OANDAApiGuide;
