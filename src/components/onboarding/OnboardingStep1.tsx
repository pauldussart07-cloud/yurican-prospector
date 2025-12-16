import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';

interface Step1Data {
  professionalStatus: string;
  jobTitle: string;
  companyName: string;
  sector: string;
  phone: string;
}

interface Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
}

const OnboardingStep1 = ({ data, onChange }: Props) => {
  const [sectors, setSectors] = useState<{ id: string; name: string; category: string | null }[]>([]);
  const [sectorSuggestions, setSectorSuggestions] = useState<string[]>([]);
  const [sectorInput, setSectorInput] = useState('');
  const [showSectorSuggestions, setShowSectorSuggestions] = useState(false);

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

  // Fetch all sectors on mount
  useEffect(() => {
    const fetchSectors = async () => {
      const { data: sectorsData } = await supabase
        .from('sectors')
        .select('id, name, category')
        .order('name');
      if (sectorsData) {
        setSectors(sectorsData);
      }
    };
    fetchSectors();
  }, []);

  // Search sectors with AI when input changes
  useEffect(() => {
    const searchSectors = async () => {
      if (sectorInput.length < 2) {
        setSectorSuggestions([]);
        return;
      }

      try {
        const { data: result, error } = await supabase.functions.invoke('semantic-search-sectors', {
          body: { query: sectorInput }
        });

        if (!error && result?.suggestions) {
          setSectorSuggestions(result.suggestions);
        }
      } catch (err) {
        console.error('Error searching sectors:', err);
      }
    };

    const debounce = setTimeout(searchSectors, 300);
    return () => clearTimeout(debounce);
  }, [sectorInput]);

  const handleSelectSector = (sectorName: string) => {
    updateField('sector', sectorName);
    setSectorInput(sectorName);
    setShowSectorSuggestions(false);
  };

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
            Intitulé de votre poste <span className="text-destructive">*</span>
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
          <Label htmlFor="companyName">
            Nom de votre entreprise <span className="text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            type="text"
            placeholder="Acme Corp"
            value={data.companyName}
            onChange={(e) => updateField('companyName', e.target.value)}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector">
            Secteur d'activité de votre entreprise <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Command className="border rounded-md">
              <CommandInput
                placeholder="Rechercher un secteur..."
                value={sectorInput}
                onValueChange={(value) => {
                  setSectorInput(value);
                  setShowSectorSuggestions(true);
                }}
                onFocus={() => setShowSectorSuggestions(true)}
                className="h-12"
              />
              {showSectorSuggestions && (sectorSuggestions.length > 0 || sectors.length > 0) && (
                <CommandList className="max-h-48 overflow-y-auto">
                  {sectorSuggestions.length > 0 ? (
                    <CommandGroup heading="Suggestions IA">
                      {sectorSuggestions.map((sector) => (
                        <CommandItem
                          key={sector}
                          value={sector}
                          onSelect={() => handleSelectSector(sector)}
                          className="cursor-pointer"
                        >
                          {sector}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : sectorInput.length < 2 ? (
                    <CommandGroup heading="Tous les secteurs">
                      {sectors.slice(0, 10).map((sector) => (
                        <CommandItem
                          key={sector.id}
                          value={sector.name}
                          onSelect={() => handleSelectSector(sector.name)}
                          className="cursor-pointer"
                        >
                          {sector.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    <CommandEmpty>Aucun secteur trouvé</CommandEmpty>
                  )}
                </CommandList>
              )}
            </Command>
            {data.sector && (
              <p className="text-sm text-muted-foreground mt-1">
                Secteur sélectionné : <span className="font-medium text-foreground">{data.sector}</span>
              </p>
            )}
          </div>
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
