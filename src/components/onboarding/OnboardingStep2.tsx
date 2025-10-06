import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

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
  const [sectors, setSectors] = useState<Array<{ id: string; name: string }>>([]);
  const [showSectorSuggestions, setShowSectorSuggestions] = useState(false);
  const [filteredSectors, setFilteredSectors] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const fetchSectors = async () => {
      const { data: sectorsData } = await supabase
        .from('sectors')
        .select('id, name')
        .order('name');
      
      if (sectorsData) {
        setSectors(sectorsData);
      }
    };

    fetchSectors();
  }, []);

  useEffect(() => {
    if (sectorInput && sectorInput.length > 0) {
      const filtered = sectors.filter(sector =>
        sector.name.toLowerCase().includes(sectorInput.toLowerCase())
      );
      setFilteredSectors(filtered);
      setShowSectorSuggestions(filtered.length > 0);
    } else {
      setFilteredSectors([]);
      setShowSectorSuggestions(false);
    }
  }, [sectorInput, sectors]);

  const updateField = (field: keyof Step2Data, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addSector = () => {
    if (sectorInput.trim() && !data.targetSectors.includes(sectorInput.trim())) {
      updateField('targetSectors', [...data.targetSectors, sectorInput.trim()]);
      setSectorInput('');
      setShowSectorSuggestions(false);
    }
  };

  const selectSector = (sectorName: string) => {
    if (!data.targetSectors.includes(sectorName)) {
      updateField('targetSectors', [...data.targetSectors, sectorName]);
    }
    setSectorInput('');
    setShowSectorSuggestions(false);
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

  const companySizes = [
    { id: 'TPE', label: 'TPE (0-9)', value: 'TPE' },
    { id: 'PME', label: 'PME (10-249)', value: 'PME' },
    { id: 'ETI', label: 'ETI (250-5000)', value: 'ETI' },
    { id: 'GE', label: 'GE (5000+)', value: 'GE' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">🏢 Votre prospect idéal</h2>
        <p className="text-lg text-muted-foreground">
          Quel(s) secteur(s) d'activité ciblez-vous ?
        </p>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Ex: Automobile, Industrie pharmaceutique..."
                value={sectorInput}
                onChange={(e) => setSectorInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSector())}
                onFocus={() => sectorInput && setShowSectorSuggestions(filteredSectors.length > 0)}
                className="h-12 text-base"
              />
              {showSectorSuggestions && (
                <div className="absolute w-full mt-1 z-50">
                  <Command className="rounded-lg border shadow-md bg-popover">
                    <CommandList>
                      <CommandEmpty>Aucun secteur trouvé</CommandEmpty>
                      <CommandGroup>
                        {filteredSectors.map((sector) => (
                          <CommandItem
                            key={sector.id}
                            onSelect={() => selectSector(sector.name)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                data.targetSectors.includes(sector.name) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {sector.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
            <Button type="button" onClick={addSector} className="h-12">
              Ajouter
            </Button>
          </div>
        </div>
        
        {data.targetSectors.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-4">
            {data.targetSectors.map((sector) => (
              <Badge key={sector} variant="secondary" className="pl-3 pr-1 py-2 text-sm">
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
        )}

        {data.targetSectors.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-muted-foreground">Quelle taille d'entreprise ?</p>
            <div className="grid grid-cols-2 gap-3">
              {companySizes.map((size) => (
                <Button
                  key={size.id}
                  type="button"
                  variant={data.companySize === size.value ? 'default' : 'outline'}
                  onClick={() => updateField('companySize', size.value)}
                  className="h-12 justify-start"
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {data.companySize && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-muted-foreground">Tranche de chiffre d'affaires ?</p>
            <Input
              placeholder="Ex: 1M-10M, 10M-50M..."
              value={data.revenueRange}
              onChange={(e) => updateField('revenueRange', e.target.value)}
              className="h-12"
            />
          </div>
        )}

        {data.revenueRange && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-muted-foreground">Dans quelle(s) région(s) ?</p>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Île-de-France, Auvergne-Rhône-Alpes..."
                value={zoneInput}
                onChange={(e) => setZoneInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addZone())}
                className="h-12"
              />
              <Button type="button" onClick={addZone} className="h-12">
                Ajouter
              </Button>
            </div>
            {data.geographicZones.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.geographicZones.map((zone) => (
                  <Badge key={zone} variant="secondary" className="pl-3 pr-1 py-2 text-sm">
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingStep2;
