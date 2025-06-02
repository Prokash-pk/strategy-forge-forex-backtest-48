
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg space-y-3">
      <Label htmlFor="configName" className="text-slate-300">Configuration Name</Label>
      <Input
        id="configName"
        placeholder="e.g., Demo Account 1, Practice Trading, etc."
        value={configName}
        onChange={(e) => onConfigNameChange(e.target.value)}
        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
      />
      <div className="flex gap-2">
        <Button
          onClick={onSave}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Save Current Config
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
