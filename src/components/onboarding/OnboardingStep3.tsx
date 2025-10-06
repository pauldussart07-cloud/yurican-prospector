import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

interface Step3Data {
  services: string[];
  decisionLevel: string;
  jobTitles: string[];
}

interface Props {
  data: Step3Data;
  onChange: (data: Step3Data) => void;
}

const OnboardingStep3 = ({ data, onChange }: Props) => {
  const [jobSuggestions, setJobSuggestions] = useState<{ name: string; category: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(-1);
  const [currentInput, setCurrentInput] = useState('');

  const availableServices = [
    'Direction',
    'Commerce',
    'Marketing',
    'Comptabilité / Finance',
    'IT',
    'RH',
    'Juridique',
    'R&D',
    'Production',
    'Logistique',
  ];

  const toggleService = (service: string) => {
    const services = data.services.includes(service)
      ? data.services.filter((s) => s !== service)
      : [...data.services, service];
    onChange({ ...data, services });
  };

  const addJobTitle = (title: string) => {
    if (title.trim() && !data.jobTitles.includes(title.trim())) {
      onChange({ ...data, jobTitles: [...data.jobTitles, title.trim()] });
      setCurrentInput('');
      setShowSuggestions(-1);
    }
  };

  const removeJobTitle = (index: number) => {
    onChange({ ...data, jobTitles: data.jobTitles.filter((_, i) => i !== index) });
  };

  const searchJobFunctions = async (query: string) => {
    if (!query || query.length < 2) {
      setJobSuggestions([]);
      return;
    }

    try {
      const { data: jobs, error } = await supabase
        .from('job_functions')
        .select('name, category')
        .ilike('name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      
      setJobSuggestions(jobs || []);
    } catch (error) {
      console.error('Error searching job functions:', error);
      setJobSuggestions([]);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchJobFunctions(currentInput);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [currentInput]);

  const handleSelectSuggestion = (jobName: string) => {
    addJobTitle(jobName);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      e.preventDefault();
      addJobTitle(currentInput);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">🎯 Parlons de votre cible</h2>
      </div>

      <div className="space-y-8">
        {/* Services */}
        <div className="space-y-4">
          <p className="text-lg font-medium text-foreground">
            Quel(s) service(s) ciblez-vous ?
          </p>
          <div className="grid grid-cols-2 gap-2 max-w-md">
            {availableServices.map((service, index) => {
              const colors = [
                'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
                'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
                'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
                'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
                'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200',
                'bg-cyan-100 text-cyan-700 border-cyan-300 hover:bg-cyan-200',
                'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200',
                'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200',
                'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200',
                'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200',
              ];
              const colorClass = colors[index % colors.length];
              return (
                <Badge
                  key={service}
                  variant={data.services.includes(service) ? 'default' : 'outline'}
                  className={`px-2 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200 justify-center ${
                    !data.services.includes(service) ? colorClass : ''
                  }`}
                  onClick={() => toggleService(service)}
                >
                  {service}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Niveau de décision */}
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground">
            Quel niveau de décision visez-vous ?
          </p>
          <RadioGroup value={data.decisionLevel} onValueChange={(value) => onChange({ ...data, decisionLevel: value })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Dirigeant" id="dirigeant" />
              <Label htmlFor="dirigeant" className="cursor-pointer">Dirigeant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Directeur / Responsable" id="directeur" />
              <Label htmlFor="directeur" className="cursor-pointer">Directeur / Responsable</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Autres collaborateurs" id="autres" />
              <Label htmlFor="autres" className="cursor-pointer">Autres collaborateurs</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Intitulés de poste (optionnel) */}
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">
              Intitulés de poste spécifiques <span className="text-sm">(optionnel)</span>
            </p>
          </div>

          {data.jobTitles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.jobTitles.map((title, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-2 text-sm">
                  {title}
                  <button
                    type="button"
                    onClick={() => removeJobTitle(index)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="relative">
            <Input
              placeholder="Ex: Intégrateur Salesforce senior..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => currentInput.length >= 2 && setShowSuggestions(0)}
              onBlur={() => setTimeout(() => setShowSuggestions(-1), 200)}
              className="h-12"
            />
            {showSuggestions >= 0 && jobSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {jobSuggestions.map((job, index) => (
                        <CommandItem
                          key={index}
                          onSelect={() => handleSelectSuggestion(job.name)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span>{job.name}</span>
                            {job.category && (
                              <span className="text-xs text-muted-foreground">{job.category}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Appuyez sur Entrée ou sélectionnez une suggestion pour ajouter un intitulé
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep3;
