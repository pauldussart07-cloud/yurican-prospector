import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Step1Data {
  jobFunction: string;
  jobLevel: string;
  growthType: string;
  productDescription: string;
  peakActivityPeriod: string;
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
        <h2 className="text-3xl font-bold mb-3">👋 Bienvenue !</h2>
        <p className="text-lg text-muted-foreground">
          Commençons par mieux vous connaître. Quelle est votre fonction ?
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Input
            id="jobFunction"
            placeholder="Ex: Directeur commercial, Sales..."
            value={data.jobFunction}
            onChange={(e) => updateField('jobFunction', e.target.value)}
            className="text-lg h-12"
          />
        </div>

        {data.jobFunction && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-muted-foreground">Quel est votre niveau ?</p>
            <RadioGroup
              value={data.jobLevel}
              onValueChange={(value) => updateField('jobLevel', value)}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="Junior" id="junior" />
                <Label htmlFor="junior" className="font-normal cursor-pointer flex-1">Junior</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="Senior" id="senior" />
                <Label htmlFor="senior" className="font-normal cursor-pointer flex-1">Senior</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {data.jobLevel && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-muted-foreground">Quel type de croissance recherchez-vous ?</p>
            <RadioGroup
              value={data.growthType}
              onValueChange={(value) => updateField('growthType', value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="Acquisition" id="acquisition" />
                <Label htmlFor="acquisition" className="font-normal cursor-pointer flex-1">Acquisition de nouveaux clients</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="Nurturing" id="nurturing" />
                <Label htmlFor="nurturing" className="font-normal cursor-pointer flex-1">Nurturing et fidélisation</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="Hybride" id="hybride" />
                <Label htmlFor="hybride" className="font-normal cursor-pointer flex-1">Les deux (Hybride)</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {data.growthType && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-muted-foreground">Décrivez votre produit ou service en quelques mots</p>
            <Textarea
              id="productDescription"
              placeholder="Ex: Logiciel SaaS pour la gestion de projets..."
              value={data.productDescription}
              onChange={(e) => updateField('productDescription', e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        )}

        {data.productDescription && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-muted-foreground">Avez-vous une période de pic d'activité ?</p>
            <Input
              id="peakActivity"
              placeholder="Ex: T3, Septembre-Novembre, Non..."
              value={data.peakActivityPeriod}
              onChange={(e) => updateField('peakActivityPeriod', e.target.value)}
              className="h-12"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingStep1;
