
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StrategyFileUploadProps {
  onStrategyLoaded: (code: string, name: string) => void;
}

const StrategyFileUpload: React.FC<StrategyFileUploadProps> = ({ onStrategyLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.py')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a Python (.py) file",
        variant: "destructive",
      });
      return;
    }

    try {
      const content = await file.text();
      
      // Validate that the file contains the required function
      if (!content.includes('def execute_strategy') && !content.includes('def strategy_logic')) {
        toast({
          title: "Invalid Strategy File",
          description: "Strategy file must contain 'execute_strategy' or 'strategy_logic' function",
          variant: "destructive",
        });
        return;
      }

      const strategyName = file.name.replace('.py', '');
      setUploadedFile(strategyName);
      onStrategyLoaded(content, strategyName);
      
      toast({
        title: "Strategy Loaded",
        description: `Successfully loaded ${strategyName}`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to read the strategy file",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Upload className="h-5 w-5" />
          Strategy Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-600 hover:border-slate-500'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {uploadedFile ? (
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
              <p className="text-emerald-400 font-medium">{uploadedFile}.py</p>
              <p className="text-slate-400 text-sm">Strategy loaded successfully</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <FileText className="h-8 w-8 text-slate-400" />
              <p className="text-slate-300">Drag & drop your Python strategy file here</p>
              <p className="text-slate-500 text-sm">File must contain execute_strategy() function</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="file-upload" className="text-slate-300">
            Or select a file
          </Label>
          <Input
            id="file-upload"
            type="file"
            accept=".py"
            onChange={handleFileSelect}
            className="bg-slate-700 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
          />
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <p>• Strategy file must be a Python (.py) file</p>
          <p>• Must contain execute_strategy(data) or strategy_logic(data) function</p>
          <p>• Function should return entry/exit signals</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyFileUpload;
