import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Step1Data {
  firstName: string;
  lastName: string;
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">👋 Bienvenue{data.firstName ? ` ${data.firstName}` : ''} !</h2>
        <p className="text-lg text-muted-foreground">
          On va commencer par quelques informations pour personnaliser votre expérience
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            Prénom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Jean"
            value={data.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Nom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Dupont"
            value={data.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className="h-12"
          />
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
