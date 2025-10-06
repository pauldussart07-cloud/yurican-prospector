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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Votre contact cible</h2>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold">
            Au sein de l'entreprise, quel est le contact que vous souhaitez atteindre ?
          </Label>
          <RadioGroup
            value={data.contactType}
            onValueChange={(value) => updateField('contactType', value)}
            className="mt-3 space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Le Dirigeant" id="dirigeant" />
              <Label htmlFor="dirigeant" className="font-normal cursor-pointer">
                Le Dirigeant
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Des directeurs" id="directeurs" />
              <Label htmlFor="directeurs" className="font-normal cursor-pointer">
                Des directeurs
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Des collaborateurs" id="collaborateurs" />
              <Label htmlFor="collaborateurs" className="font-normal cursor-pointer">
                Des collaborateurs
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-base font-semibold">
            Dans quel département ?
          </Label>
          <div className="grid grid-cols-2 gap-3 mt-3">
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

        <div>
          <Label htmlFor="specificRole" className="text-base font-semibold">
            Ciblez-vous un poste précis ?
          </Label>
          <p className="text-sm text-muted-foreground mb-2 italic">
            Exemple : Intégrateur salesforce senior
          </p>
          <Input
            id="specificRole"
            placeholder="Ex: Intégrateur salesforce senior..."
            value={data.specificRole}
            onChange={(e) => updateField('specificRole', e.target.value)}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep3;
