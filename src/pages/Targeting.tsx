import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTargeting } from '@/contexts/TargetingContext';
import { Plus, Trash2, Check, X, Building2, Users } from 'lucide-react';

interface Targeting {
  id: string;
  name: string;
  departments: string[];
  sectors: string[];
  min_headcount: number | null;
  max_headcount: number | null;
  min_revenue: number | null;
  max_revenue: number | null;
  is_active: boolean;
}

interface Persona {
  id: string;
  name: string;
  service: string;
  decision_level: string;
}

const SERVICES = ['Commerce', 'Marketing', 'IT', 'RH', 'Direction', 'Finance', 'Production', 'Logistique'];
const DECISION_LEVELS = ['Décisionnaire', 'Influenceur', 'Utilisateur'];

const Targeting = () => {
  const { toast } = useToast();
  const { activeTargeting, setActiveTargeting } = useTargeting();
  const [targetings, setTargetings] = useState<Targeting[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTargetingForm, setShowTargetingForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  // Targeting form state
  const [name, setName] = useState('');
  const [departments, setDepartments] = useState('');
  const [sectors, setSectors] = useState('');
  const [minHeadcount, setMinHeadcount] = useState('');
  const [maxHeadcount, setMaxHeadcount] = useState('');
  const [minRevenue, setMinRevenue] = useState('');
  const [maxRevenue, setMaxRevenue] = useState('');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [service, setService] = useState('');
  const [decisionLevel, setDecisionLevel] = useState('');

  useEffect(() => {
    loadTargetings();
    loadPersonas();
  }, []);

  const loadTargetings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('targetings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les ciblages',
        variant: 'destructive',
      });
    } else {
      setTargetings(data as Targeting[]);
    }
  };

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
        description: 'Impossible de charger les ciblages contacts',
        variant: 'destructive',
      });
    } else {
      setPersonas(data as Persona[]);
    }
  };

  const handleCreateTargeting = async () => {
    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un nom pour le ciblage',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('targetings').insert({
      user_id: user.id,
      name,
      departments: departments.split(',').map(d => d.trim()).filter(d => d),
      sectors: sectors.split(',').map(s => s.trim()).filter(s => s),
      min_headcount: minHeadcount ? parseInt(minHeadcount) : null,
      max_headcount: maxHeadcount ? parseInt(maxHeadcount) : null,
      min_revenue: minRevenue ? parseInt(minRevenue) * 1000000 : null,
      max_revenue: maxRevenue ? parseInt(maxRevenue) * 1000000 : null,
      is_active: false,
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le ciblage',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Succès',
        description: 'Ciblage créé avec succès',
      });
      resetTargetingForm();
      setShowTargetingForm(false);
      loadTargetings();
    }
  };

  const handleCreateContact = async () => {
    if (!contactName.trim() || !service || !decisionLevel) {
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
      name: contactName,
      service: service as any,
      decision_level: decisionLevel as any,
    }]);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le ciblage contact',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Succès',
        description: 'Ciblage contact créé avec succès',
      });
      resetContactForm();
      setShowContactForm(false);
      loadPersonas();
    }
  };

  const resetTargetingForm = () => {
    setName('');
    setDepartments('');
    setSectors('');
    setMinHeadcount('');
    setMaxHeadcount('');
    setMinRevenue('');
    setMaxRevenue('');
  };

  const resetContactForm = () => {
    setContactName('');
    setService('');
    setDecisionLevel('');
  };

  const handleActivateTargeting = async (targetingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('targetings')
      .update({ is_active: false })
      .eq('user_id', user.id);

    const { data, error } = await supabase
      .from('targetings')
      .update({ is_active: true })
      .eq('id', targetingId)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'activer le ciblage',
        variant: 'destructive',
      });
    } else {
      setActiveTargeting(data as Targeting);
      toast({
        title: 'Succès',
        description: 'Ciblage activé',
      });
      loadTargetings();
    }
  };

  const handleDeleteTargeting = async (targetingId: string) => {
    const { error } = await supabase
      .from('targetings')
      .delete()
      .eq('id', targetingId);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le ciblage',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Succès',
        description: 'Ciblage supprimé',
      });
      loadTargetings();
      if (activeTargeting?.id === targetingId) {
        setActiveTargeting(null);
      }
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', contactId);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le ciblage contact',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Succès',
        description: 'Ciblage contact supprimé',
      });
      loadPersonas();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ciblage</h1>
        {activeTargeting && (
          <div className="mt-2">
            <Badge variant="default" className="flex items-center gap-1 w-fit">
              <Check className="h-3 w-3" />
              Ciblage actif : {activeTargeting.name}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ciblages Entreprises - Gauche */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Ciblages Entreprises
            </h2>
            <Button
              size="sm"
              onClick={() => setShowTargetingForm(!showTargetingForm)}
              variant={showTargetingForm ? "outline" : "default"}
            >
              {showTargetingForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {showTargetingForm ? 'Annuler' : 'Ajouter'}
            </Button>
          </div>

          {showTargetingForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nouveau ciblage entreprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom du ciblage</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mon ciblage Paris Tech"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departments">Départements</Label>
                    <Input
                      id="departments"
                      value={departments}
                      onChange={(e) => setDepartments(e.target.value)}
                      placeholder="75, 69, 33"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sectors">Secteurs</Label>
                    <Input
                      id="sectors"
                      value={sectors}
                      onChange={(e) => setSectors(e.target.value)}
                      placeholder="Tech, Conseil"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minHeadcount">Effectif min</Label>
                    <Input
                      id="minHeadcount"
                      type="number"
                      value={minHeadcount}
                      onChange={(e) => setMinHeadcount(e.target.value)}
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxHeadcount">Effectif max</Label>
                    <Input
                      id="maxHeadcount"
                      type="number"
                      value={maxHeadcount}
                      onChange={(e) => setMaxHeadcount(e.target.value)}
                      placeholder="500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minRevenue">CA min (M€)</Label>
                    <Input
                      id="minRevenue"
                      type="number"
                      value={minRevenue}
                      onChange={(e) => setMinRevenue(e.target.value)}
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxRevenue">CA max (M€)</Label>
                    <Input
                      id="maxRevenue"
                      type="number"
                      value={maxRevenue}
                      onChange={(e) => setMaxRevenue(e.target.value)}
                      placeholder="50"
                    />
                  </div>
                </div>

                <Button onClick={handleCreateTargeting} disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le ciblage
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {targetings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Aucun ciblage entreprise créé
                </CardContent>
              </Card>
            ) : (
              targetings.map((targeting) => (
                <Card key={targeting.id} className={targeting.is_active ? 'border-primary border-2' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{targeting.name}</h3>
                          {targeting.is_active && (
                            <Badge variant="default" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Actif
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm space-y-1">
                          {targeting.departments.length > 0 && (
                            <div className="text-muted-foreground">
                              Dép: {targeting.departments.join(', ')}
                            </div>
                          )}
                          {targeting.sectors.length > 0 && (
                            <div className="text-muted-foreground">
                              Secteurs: {targeting.sectors.join(', ')}
                            </div>
                          )}
                          {(targeting.min_headcount || targeting.max_headcount) && (
                            <div className="text-muted-foreground">
                              Effectif: {targeting.min_headcount || '0'} - {targeting.max_headcount || '∞'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {!targeting.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivateTargeting(targeting.id)}
                          >
                            Activer
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTargeting(targeting.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Ciblages Contacts - Droite */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ciblages Contacts
            </h2>
            <Button
              size="sm"
              onClick={() => setShowContactForm(!showContactForm)}
              variant={showContactForm ? "outline" : "default"}
            >
              {showContactForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {showContactForm ? 'Annuler' : 'Ajouter'}
            </Button>
          </div>

          {showContactForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nouveau ciblage contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contact-name">Nom du ciblage</Label>
                  <Input
                    id="contact-name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Directeur Commercial"
                  />
                </div>

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

                <Button onClick={handleCreateContact} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le ciblage contact
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {personas.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Aucun ciblage contact créé
                </CardContent>
              </Card>
            ) : (
              personas.map((persona) => (
                <Card key={persona.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{persona.name}</div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{persona.service}</Badge>
                          <Badge variant="secondary" className="text-xs">{persona.decision_level}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteContact(persona.id)}
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
      </div>
    </div>
  );
};

export default Targeting;
