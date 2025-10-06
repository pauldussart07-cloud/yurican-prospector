import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useState } from 'react';

interface Step2Data {
  targetSectors: string[];
  companySize: string;
  revenueRange: string;
  geographicZones: string[];
}

interface Props {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
}

const OnboardingStep2 = ({ data, onChange }: Props) => {
  const [sectorInput, setSectorInput] = useState('');
  const [zoneInput, setZoneInput] = useState('');

  const updateField = (field: keyof Step2Data, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addSector = () => {
    if (sectorInput.trim() && !data.targetSectors.includes(sectorInput.trim())) {
      updateField('targetSectors', [...data.targetSectors, sectorInput.trim()]);
      setSectorInput('');
    }
  };

  const removeSector = (sector: string) => {
    updateField('targetSectors', data.targetSectors.filter(s => s !== sector));
  };

  const addZone = () => {
    if (zoneInput.trim() && !data.geographicZones.includes(zoneInput.trim())) {
      updateField('geographicZones', [...data.geographicZones, zoneInput.trim()]);
      setZoneInput('');
    }
  };

  const removeZone = (zone: string) => {
    updateField('geographicZones', data.geographicZones.filter(z => z !== zone));
  };

  const companySizes = ['TPE', 'PME', 'ETI', 'GE'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Votre client cible</h2>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="sectors" className="text-base font-semibold">
            Dites-nous quelle sont les entreprises que vous ciblez
          </Label>
          <p className="text-sm text-muted-foreground mb-2 italic">
            Exemple : je cible l'industrie automobile
          </p>
          <div className="flex gap-2 mt-2">
            <Input
              id="sectors"
              placeholder="Ex: Automobile, Industrie..."
              value={sectorInput}
              onChange={(e) => setSectorInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSector()}
            />
            <Button type="button" onClick={addSector}>
              Ajouter
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {data.targetSectors.map((sector) => (
              <Badge key={sector} variant="secondary" className="pl-3 pr-1 py-1">
                {sector}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 ml-1"
                  onClick={() => removeSector(sector)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold">
            Quelle taille d'entreprise ciblez-vous ?
          </Label>
          <div className="grid grid-cols-4 gap-3 mt-2">
            {companySizes.map((size) => (
              <Button
                key={size}
                type="button"
                variant={data.companySize === size ? 'default' : 'outline'}
                onClick={() => updateField('companySize', size)}
                className="h-12"
              >
                {size}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="revenue" className="text-base font-semibold">
            Chiffre d'affaire de votre cible
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Picklist : tranche de CA
          </p>
          <Input
            id="revenue"
            placeholder="Ex: 1M-10M, 10M-50M..."
            value={data.revenueRange}
            onChange={(e) => updateField('revenueRange', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="zones" className="text-base font-semibold">
            Quelle zone géographique ?
          </Label>
          <p className="text-sm text-muted-foreground mb-2 italic">
            Exemple : Carte France avec régions à cliquer
          </p>
          <div className="flex gap-2 mt-2">
            <Input
              id="zones"
              placeholder="Ex: Île-de-France, Auvergne-Rhône-Alpes..."
              value={zoneInput}
              onChange={(e) => setZoneInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addZone()}
            />
            <Button type="button" onClick={addZone}>
              Ajouter
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {data.geographicZones.map((zone) => (
              <Badge key={zone} variant="secondary" className="pl-3 pr-1 py-1">
                {zone}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 ml-1"
                  onClick={() => removeZone(zone)}
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

export default OnboardingStep2;
