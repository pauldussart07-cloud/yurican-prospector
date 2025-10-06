import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step1Data {
  jobFunction: string;
  growthType: string;
  productDescription: string;
  peakActivityPeriod: string;
}

interface Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
}

const OnboardingStep1 = ({ data, onChange }: Props) => {
  const [jobFunctions, setJobFunctions] = useState<Array<{ id: string; name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredFunctions, setFilteredFunctions] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const fetchJobFunctions = async () => {
      const { data: functions } = await supabase
        .from('job_functions')
        .select('id, name')
        .order('name');
      
      if (functions) {
        setJobFunctions(functions);
      }
    };

    fetchJobFunctions();
  }, []);

  useEffect(() => {
    if (data.jobFunction && data.jobFunction.length > 0) {
      const filtered = jobFunctions.filter(func =>
        func.name.toLowerCase().includes(data.jobFunction.toLowerCase())
      );
      setFilteredFunctions(filtered);
      setShowSuggestions(filtered.length > 0 && data.jobFunction !== filtered.find(f => f.name === data.jobFunction)?.name);
    } else {
      setFilteredFunctions([]);
      setShowSuggestions(false);
    }
  }, [data.jobFunction, jobFunctions]);

  const updateField = (field: keyof Step1Data, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const selectFunction = (functionName: string) => {
    updateField('jobFunction', functionName);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">👋 Bienvenue !</h2>
        <p className="text-lg text-muted-foreground">
          Quelle est votre fonction ? Cela nous aidera à mieux cibler votre marché
        </p>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <Input
            id="jobFunction"
            placeholder="Ex: Directeur commercial, Sales..."
            value={data.jobFunction}
            onChange={(e) => updateField('jobFunction', e.target.value)}
            onFocus={() => data.jobFunction && setShowSuggestions(filteredFunctions.length > 0)}
            className="text-lg h-12"
          />
          {showSuggestions && (
            <div className="absolute w-full mt-1 z-50">
              <Command className="rounded-lg border shadow-md">
                <CommandList>
                  <CommandEmpty>Aucune fonction trouvée</CommandEmpty>
                  <CommandGroup>
                    {filteredFunctions.map((func) => (
                      <CommandItem
                        key={func.id}
                        onSelect={() => selectFunction(func.name)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            data.jobFunction === func.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {func.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}
        </div>

        {data.jobFunction && (
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
