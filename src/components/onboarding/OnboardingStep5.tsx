import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { useState } from 'react';

interface Step5Data {
  trackedEvents: string[];
}

interface Props {
  data: Step5Data;
  onChange: (data: Step5Data) => void;
}

const OnboardingStep5 = ({ data, onChange }: Props) => {
  const [eventInput, setEventInput] = useState('');

  const updateField = (field: keyof Step5Data, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addEvent = () => {
    if (eventInput.trim() && !data.trackedEvents.includes(eventInput.trim())) {
      updateField('trackedEvents', [...data.trackedEvents, eventInput.trim()]);
      setEventInput('');
    }
  };

  const removeEvent = (event: string) => {
    updateField('trackedEvents', data.trackedEvents.filter(e => e !== event));
  };

  const commonEvents = [
    'Levée de fonds',
    'Fusion acquisition',
    'Nomination',
    'Offres d\'emploi',
    'Nouveaux produits',
    'Expansion géographique',
  ];

  const toggleEvent = (event: string) => {
    if (data.trackedEvents.includes(event)) {
      removeEvent(event);
    } else {
      updateField('trackedEvents', [...data.trackedEvents, event]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">🎉 Dernière étape !</h2>
        <p className="text-lg text-muted-foreground">
          Quelles actualités vous intéressent ?
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {commonEvents.map((event) => (
            <Button
              key={event}
              type="button"
              variant={data.trackedEvents.includes(event) ? 'default' : 'outline'}
              onClick={() => toggleEvent(event)}
              className="h-12 justify-start"
            >
              {event}
            </Button>
          ))}
        </div>

        {data.trackedEvents.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-muted-foreground">Besoin d'ajouter autre chose ? (optionnel)</p>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Changement de direction, Nouveaux marchés..."
                value={eventInput}
                onChange={(e) => setEventInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEvent())}
                className="h-12"
              />
              <Button type="button" onClick={addEvent} className="h-12">
                Ajouter
              </Button>
            </div>
            {data.trackedEvents.filter(e => !commonEvents.includes(e)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.trackedEvents.filter(e => !commonEvents.includes(e)).map((event) => (
                  <Badge key={event} variant="secondary" className="pl-3 pr-1 py-2 text-sm">
                    {event}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 ml-1"
                      onClick={() => removeEvent(event)}
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

export default OnboardingStep5;
