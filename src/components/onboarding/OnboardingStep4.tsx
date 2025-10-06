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

  const crmOptions = ['Salesforce', 'HubSpot', 'Pipedrive', 'Aucun'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">🛠️ Vos outils</h2>
        <p className="text-lg text-muted-foreground">
          Utilisez-vous un CRM ?
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
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

        {data.crmTool && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-muted-foreground">Quels autres outils utilisez-vous ? (optionnel)</p>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Lemlist, Pharrow, LinkedIn Sales Navigator..."
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
                className="h-12"
              />
              <Button type="button" onClick={addTool} className="h-12">
                Ajouter
              </Button>
            </div>
            {data.otherTools.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.otherTools.map((tool) => (
                  <Badge key={tool} variant="secondary" className="pl-3 pr-1 py-2 text-sm">
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingStep4;
