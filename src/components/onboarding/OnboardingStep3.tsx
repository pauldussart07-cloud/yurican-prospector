import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

interface Step3Data {
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

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">
              Donnez-nous au moins 3 exemples d'intitulés de poste que vous ciblez
            </p>
            {data.jobTitles.length < 3 && (
              <p className="text-sm text-muted-foreground">
                {data.jobTitles.length}/3 minimum
              </p>
            )}
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
