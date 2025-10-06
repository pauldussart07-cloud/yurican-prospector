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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Tu travailles dans :</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Secteur d'activité (résultat auto-complétions grâce au SIRET) + Typologie entreprise + adresse de l'entreprise
          <br />
          <span className="italic">Au complète automatiquement les champs, si erreur, possibilité de corriger</span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="jobFunction" className="text-base font-semibold">
            Quel est ta fonction ?
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Picklist : Sales / directeur commercial / freelance / étudiant
          </p>
          <Input
            id="jobFunction"
            placeholder="Ex: Sales, Directeur commercial..."
            value={data.jobFunction}
            onChange={(e) => updateField('jobFunction', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-base font-semibold">Niveau de poste</Label>
          <RadioGroup
            value={data.jobLevel}
            onValueChange={(value) => updateField('jobLevel', value)}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Junior" id="junior" />
              <Label htmlFor="junior" className="font-normal cursor-pointer">Junior</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Senior" id="senior" />
              <Label htmlFor="senior" className="font-normal cursor-pointer">Senior</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-base font-semibold">Type de croissance</Label>
          <RadioGroup
            value={data.growthType}
            onValueChange={(value) => updateField('growthType', value)}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Acquisition" id="acquisition" />
              <Label htmlFor="acquisition" className="font-normal cursor-pointer">Acquisition</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Nurturing" id="nurturing" />
              <Label htmlFor="nurturing" className="font-normal cursor-pointer">Nurturing</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Hybride" id="hybride" />
              <Label htmlFor="hybride" className="font-normal cursor-pointer">Hybride</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="productDescription" className="text-base font-semibold">
            Parlez-nous de votre produit ou service en quelques mots
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Produits / Services normée (Saas veille marchés publics)
            <br />
            <span className="italic">Exemple : je gère une société industrielle qui fabrique des résistances chauffantes</span>
          </p>
          <Textarea
            id="productDescription"
            placeholder="Décrivez votre produit ou service..."
            value={data.productDescription}
            onChange={(e) => updateField('productDescription', e.target.value)}
            className="mt-2 min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="peakActivity" className="text-base font-semibold">
            As-tu une période avec un pic d'activité commerciale
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Tranche de mois / Trimestre / Non
            <br />
            <span className="italic">Exemple : Pic d'activité au troisième trimestre</span>
          </p>
          <Input
            id="peakActivity"
            placeholder="Ex: Troisième trimestre, Septembre-Novembre..."
            value={data.peakActivityPeriod}
            onChange={(e) => updateField('peakActivityPeriod', e.target.value)}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep1;
