import { Label } from '@/components/ui/label';
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
    'Levée de fond',
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Bravo et merci....</h2>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold">
            Quelles actualités recherches-tu ?
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Picklist (actu normée) : Levée de fond, Fusion acquisition, nomination...
            <br />
            <span className="italic">La picklist est dépendante du secteur d'activité du user (ex: Si RH → offres d'emploi...)</span>
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
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

          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Ajouter une autre actualité..."
              value={eventInput}
              onChange={(e) => setEventInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addEvent()}
            />
            <Button type="button" onClick={addEvent}>
              Ajouter
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {data.trackedEvents.filter(e => !commonEvents.includes(e)).map((event) => (
              <Badge key={event} variant="secondary" className="pl-3 pr-1 py-1">
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
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep5;
