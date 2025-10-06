import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

interface Step3Data {
  contactType: string;
  departments: string[];
  specificRole: string;
}

interface Props {
  data: Step3Data;
  onChange: (data: Step3Data) => void;
}

const OnboardingStep3 = ({ data, onChange }: Props) => {
  const [jobSuggestions, setJobSuggestions] = useState<{ name: string; category: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const updateField = (field: keyof Step3Data, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const toggleDepartment = (dept: string) => {
    if (data.departments.includes(dept)) {
      updateField('departments', data.departments.filter(d => d !== dept));
    } else {
      updateField('departments', [...data.departments, dept]);
    }
  };

  const searchJobFunctions = async (query: string) => {
    if (!query || query.length < 2) {
      setJobSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data: jobs, error } = await supabase
        .from('job_functions')
        .select('name, category')
        .ilike('name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      
      setJobSuggestions(jobs || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching job functions:', error);
      setJobSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchJobFunctions(data.specificRole);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [data.specificRole]);

  const handleSelectSuggestion = (jobName: string) => {
    updateField('specificRole', jobName);
    setShowSuggestions(false);
  };

  const departments = [
    'Direction générale',
    'Commerce',
    'Marketing',
    'Achat',
    'RH',
    'IT',
    'Production',
    'Logistique',
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">🎯 Parlons de votre cible</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <p className="text-muted-foreground">Dans quel(s) service(s) ?</p>
          <div className="grid grid-cols-2 gap-3">
            {departments.map((dept) => (
              <Button
                key={dept}
                type="button"
                variant={data.departments.includes(dept) ? 'default' : 'outline'}
                onClick={() => toggleDepartment(dept)}
                className="h-12 justify-start"
              >
                {dept}
              </Button>
            ))}
          </div>
        </div>

        {data.departments.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-lg text-muted-foreground">
              Quel est votre interlocuteur privilégié
            </p>
            <RadioGroup
              value={data.contactType}
              onValueChange={(value) => updateField('contactType', value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="Directeur / Responsable" id="directeur" />
                <Label htmlFor="directeur" className="font-normal cursor-pointer flex-1">
                  Directeur / Responsable
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="Autres collaborateurs" id="collaborateurs" />
                <Label htmlFor="collaborateurs" className="font-normal cursor-pointer flex-1">
                  Autres collaborateurs
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

      </div>
    </div>
  );
};

export default OnboardingStep3;
