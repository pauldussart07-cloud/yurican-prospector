import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useState } from 'react';

interface Step4Data {
  crmTool: string;
  otherTools: string[];
}

interface Props {
  data: Step4Data;
  onChange: (data: Step4Data) => void;
}

const OnboardingStep4 = ({ data, onChange }: Props) => {
  const [toolInput, setToolInput] = useState('');

  const updateField = (field: keyof Step4Data, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addTool = () => {
    if (toolInput.trim() && !data.otherTools.includes(toolInput.trim())) {
      updateField('otherTools', [...data.otherTools, toolInput.trim()]);
      setToolInput('');
    }
  };

  const removeTool = (tool: string) => {
    updateField('otherTools', data.otherTools.filter(t => t !== tool));
  };

  const crmOptions = ['Salesforce', 'HubSpot', 'Pipedrive', 'Aucune'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Vos outils</h2>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold">Votre CRM</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Picklist : Salesforce, HubSpot, Pipedrive, Aucune
          </p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {crmOptions.map((crm) => (
              <Button
                key={crm}
                type="button"
                variant={data.crmTool === crm ? 'default' : 'outline'}
                onClick={() => updateField('crmTool', crm)}
                className="h-12"
              >
                {crm}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="otherTools" className="text-base font-semibold">
            Vos outils
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Picklist : Lemlist, Pharrow, etc...
          </p>
          <div className="flex gap-2 mt-2">
            <Input
              id="otherTools"
              placeholder="Ex: Lemlist, Pharrow..."
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTool()}
            />
            <Button type="button" onClick={addTool}>
              Ajouter
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {data.otherTools.map((tool) => (
              <Badge key={tool} variant="secondary" className="pl-3 pr-1 py-1">
                {tool}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 ml-1"
                  onClick={() => removeTool(tool)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep4;
