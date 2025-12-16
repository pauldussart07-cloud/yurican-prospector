import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Step1Data {
  professionalStatus: string;
  jobTitle: string;
  phone: string;
}

interface Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
}

const OnboardingStep1 = ({ data, onChange }: Props) => {
  const updateField = (field: keyof Step1Data, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const professionalStatusOptions = [
    { value: 'employee', label: 'Employé' },
    { value: 'freelance', label: 'Indépendant / Freelance' },
    { value: 'job_seeking', label: "En recherche d'emploi" },
    { value: 'creating_business', label: "En création d'entreprise" },
    { value: 'student', label: 'Étudiant' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">👋 Bienvenue !</h2>
        <p className="text-lg text-muted-foreground">
          On va commencer par quelques informations pour personnaliser votre expérience
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="professionalStatus">
            Situation professionnelle <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.professionalStatus}
            onValueChange={(value) => updateField('professionalStatus', value)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Sélectionnez votre situation" />
            </SelectTrigger>
            <SelectContent>
              {professionalStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobTitle">
            Intitulé du poste <span className="text-destructive">*</span>
          </Label>
          <Input
            id="jobTitle"
            type="text"
            placeholder="Directeur Commercial"
            value={data.jobTitle}
            onChange={(e) => updateField('jobTitle', e.target.value)}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+33 6 12 34 56 78"
            value={data.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="h-12"
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep1;
