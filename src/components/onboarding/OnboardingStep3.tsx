import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Step3Data {
  contactType: string;
  departments: string[];
  specificRole: string;
}

interface Props {
  data: Step3Data;
  onChange: (data: Step3Data) => void;
}

const OnboardingStep3 = ({ data, onChange }: Props) => {
  const updateField = (field: keyof Step3Data, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const toggleDepartment = (dept: string) => {
    if (data.departments.includes(dept)) {
      updateField('departments', data.departments.filter(d => d !== dept));
    } else {
      updateField('departments', [...data.departments, dept]);
    }
  };

  const departments = [
    'Direction générale',
    'Commerce',
    'Marketing',
    'Achat',
    'RH',
    'IT',
    'Production',
    'Logistique',
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">🎯 Parlons de votre cible</h2>
        <p className="text-lg text-muted-foreground">
          Quel est votre interlocuteur privilégié
        </p>
      </div>

      <div className="space-y-6">
        <RadioGroup
          value={data.contactType}
          onValueChange={(value) => updateField('contactType', value)}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="Décisionnaire" id="decisionnaire" />
            <Label htmlFor="decisionnaire" className="font-normal cursor-pointer flex-1">
              Décisionnaire
            </Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="Influenceur" id="influenceur" />
            <Label htmlFor="influenceur" className="font-normal cursor-pointer flex-1">
              Influenceur
            </Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="Utilisateur" id="utilisateur" />
            <Label htmlFor="utilisateur" className="font-normal cursor-pointer flex-1">
              Utilisateur
            </Label>
          </div>
        </RadioGroup>

        {data.contactType && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-muted-foreground">Dans quel(s) service(s) ?</p>
            <div className="grid grid-cols-2 gap-3">
              {departments.map((dept) => (
                <Button
                  key={dept}
                  type="button"
                  variant={data.departments.includes(dept) ? 'default' : 'outline'}
                  onClick={() => toggleDepartment(dept)}
                  className="h-12 justify-start"
                >
                  {dept}
                </Button>
              ))}
            </div>
          </div>
        )}

        {data.departments.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-muted-foreground">Ciblez-vous un poste précis ? (optionnel)</p>
            <Input
              id="specificRole"
              placeholder="Ex: Intégrateur Salesforce senior..."
              value={data.specificRole}
              onChange={(e) => updateField('specificRole', e.target.value)}
              className="h-12"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingStep3;
