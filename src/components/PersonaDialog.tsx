import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Plus, Trash2 } from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  service: string;
  decision_level: string;
}

const SERVICES = ['Commerce', 'Marketing', 'IT', 'RH', 'Direction', 'Finance', 'Production', 'Logistique'];
const DECISION_LEVELS = ['Décisionnaire', 'Influenceur', 'Utilisateur'];

export const PersonaDialog = () => {
  const { toast } = useToast();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [open, setOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [decisionLevel, setDecisionLevel] = useState('');

  useEffect(() => {
    if (open) {
      loadPersonas();
    }
  }, [open]);

  const loadPersonas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les personae',
        variant: 'destructive',
      });
    } else {
      setPersonas(data as Persona[]);
    }
  };

  const handleCreatePersona = async () => {
    if (!name.trim() || !service || !decisionLevel) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive',
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('personas').insert([{
      user_id: user.id,
      name,
      service: service as any,
      decision_level: decisionLevel as any,
    }]);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le persona',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Succès',
        description: 'Persona créé avec succès',
      });
      // Reset form
      setName('');
      setService('');
      setDecisionLevel('');
      loadPersonas();
    }
  };

  const handleDeletePersona = async (personaId: string) => {
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', personaId);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le persona',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Succès',
        description: 'Persona supprimé',
      });
      loadPersonas();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Personae
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion des Personae</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new persona */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="persona-name">Nom du persona</Label>
                <Input
                  id="persona-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Directeur Commercial"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="decision-level">Niveau de décision</Label>
                  <Select value={decisionLevel} onValueChange={setDecisionLevel}>
                    <SelectTrigger id="decision-level">
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {DECISION_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleCreatePersona}>
                <Plus className="h-4 w-4 mr-2" />
                Créer le persona
              </Button>
            </CardContent>
          </Card>

          {/* List of personas */}
          <div className="space-y-3">
            <h3 className="font-semibold">Mes personae</h3>
            {personas.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                Aucun persona créé
              </div>
            ) : (
              personas.map((persona) => (
                <Card key={persona.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{persona.name}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{persona.service}</Badge>
                          <Badge variant="secondary">{persona.decision_level}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePersona(persona.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
