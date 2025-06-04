
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wifi } from 'lucide-react';

interface AddAccountFormProps {
  configName: string;
  onConfigNameChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const AddAccountForm: React.FC<AddAccountFormProps> = ({
  configName,
  onConfigNameChange,
  onSave,
  onCancel
}) => {
  return (
    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Wifi className="h-4 w-4 text-emerald-400" />
        <h3 className="text-emerald-300 font-medium">Connected - Ready to Save</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="configName" className="text-slate-300">Account Name</Label>
        <Input
          id="configName"
          placeholder="e.g., Demo Account 1, Practice Trading, etc."
          value={configName}
          onChange={(e) => onConfigNameChange(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
        />
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={onSave}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Save & Connect 24/7
        </Button>
        <Button
          onClick={onCancel}
          size="sm"
          variant="outline"
          className="border-slate-600 text-slate-300"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default AddAccountForm;
