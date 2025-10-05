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
import { Plus, Trash2, Check, X, Building2, Users, GripVertical } from 'lucide-react';
import PodiumIcon from '@/components/PodiumIcon';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  position: number;
}

const SERVICES = ['Commerce', 'Marketing', 'IT', 'RH', 'Direction', 'Finance', 'Production', 'Logistique'];
const DECISION_LEVELS = ['Décisionnaire', 'Influenceur', 'Utilisateur'];

interface SortablePersonaCardProps {
  persona: Persona;
  index: number;
  onDelete: (id: string) => void;
}

const SortablePersonaCard = ({ persona, index, onDelete }: SortablePersonaCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: persona.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? 'shadow-lg' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
              {index + 1}
            </div>
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
              onClick={() => onDelete(persona.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SECTORS = [
  'Technologie et Numérique',
  'Services aux Entreprises',
  'Industrie',
  'Commerce et Distribution',
  'Santé et Social',
  'Finance et Assurance',
  'BTP et Construction',
  'Transport et Logistique',
  'Agriculture et Agroalimentaire',
  'Éducation et Formation',
  'Tourisme et Hôtellerie',
  'Énergie et Environnement',
];

const REGIONS = {
  'France entière': [],
  'Auvergne-Rhône-Alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  'Bourgogne-Franche-Comté': ['21', '25', '39', '58', '70', '71', '89', '90'],
  'Bretagne': ['22', '29', '35', '56'],
  'Centre-Val de Loire': ['18', '28', '36', '37', '41', '45'],
  'Corse': ['2A', '2B'],
  'Grand Est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
  'Hauts-de-France': ['02', '59', '60', '62', '80'],
  'Île-de-France': ['75', '77', '78', '91', '92', '93', '94', '95'],
  'Normandie': ['14', '27', '50', '61', '76'],
  'Nouvelle-Aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  'Occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  'Pays de la Loire': ['44', '49', '53', '72', '85'],
  'Provence-Alpes-Côte d\'Azur': ['04', '05', '06', '13', '83', '84'],
};

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
  const [locationType, setLocationType] = useState<'france' | 'region' | 'department'>('france');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
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
      .order('position', { ascending: true });

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
    
    if (!user) {
      console.log('No user found');
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer un ciblage',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    console.log('User:', user.id);

    // Déterminer les départements selon le type de localisation
    let departmentsToSave: string[] = [];
    if (locationType === 'france') {
      departmentsToSave = [];
    } else if (locationType === 'region' && selectedRegions.length > 0) {
      // Combiner les départements de toutes les régions sélectionnées
      const allDepts = selectedRegions.flatMap(region => 
        REGIONS[region as keyof typeof REGIONS] || []
      );
      departmentsToSave = [...new Set(allDepts)]; // Supprimer les doublons
    } else if (locationType === 'department') {
      departmentsToSave = selectedDepartments;
    }

    const dataToInsert = {
      user_id: user.id,
      name,
      departments: departmentsToSave,
      sectors: selectedSectors,
      min_headcount: minHeadcount ? parseInt(minHeadcount) : null,
      max_headcount: maxHeadcount ? parseInt(maxHeadcount) : null,
      min_revenue: minRevenue ? parseInt(minRevenue) * 1000000 : null,
      max_revenue: maxRevenue ? parseInt(maxRevenue) * 1000000 : null,
      is_active: false,
    };

    console.log('Data to insert:', dataToInsert);

    const { data, error } = await supabase.from('targetings').insert(dataToInsert).select();

    console.log('Insert result:', { data, error });

    setLoading(false);

    if (error) {
      console.error('Error creating targeting:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de créer le ciblage: ${error.message}`,
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

    if (personas.length >= 3) {
      toast({
        title: 'Limite atteinte',
        description: 'Vous ne pouvez créer que 3 ciblages contacts maximum',
        variant: 'destructive',
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const nextPosition = personas.length;

    const { error } = await supabase.from('personas').insert([{
      user_id: user.id,
      name: contactName,
      service: service as any,
      decision_level: decisionLevel as any,
      position: nextPosition,
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
    setLocationType('france');
    setSelectedRegions([]);
    setSelectedDepartments([]);
    setSelectedSectors([]);
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
      // Réorganiser les positions après suppression
      const remainingPersonas = personas.filter(p => p.id !== contactId);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        for (let i = 0; i < remainingPersonas.length; i++) {
          await supabase
            .from('personas')
            .update({ position: i })
            .eq('id', remainingPersonas[i].id);
        }
      }
      
      toast({
        title: 'Succès',
        description: 'Ciblage contact supprimé',
      });
      loadPersonas();
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = personas.findIndex((p) => p.id === active.id);
      const newIndex = personas.findIndex((p) => p.id === over.id);

      const newOrder = arrayMove(personas, oldIndex, newIndex);
      setPersonas(newOrder);

      // Mettre à jour les positions dans la base de données
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        for (let i = 0; i < newOrder.length; i++) {
          await supabase
            .from('personas')
            .update({ position: i })
            .eq('id', newOrder[i].id);
        }
      }

      toast({
        title: 'Ordre mis à jour',
        description: 'Le classement des ciblages contacts a été sauvegardé',
      });
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

                <div className="space-y-3">
                  <Label>Localisation</Label>
                  <Select value={locationType} onValueChange={(value: any) => {
                    setLocationType(value);
                    setSelectedRegions([]);
                    setSelectedDepartments([]);
                  }}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="france">France entière</SelectItem>
                      <SelectItem value="region">Région</SelectItem>
                      <SelectItem value="department">Département</SelectItem>
                    </SelectContent>
                  </Select>

                  {locationType === 'region' && (
                    <div className="space-y-2">
                      <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                        {Object.keys(REGIONS).filter(r => r !== 'France entière').map((region) => (
                          <label key={region} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedRegions.includes(region)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRegions([...selectedRegions, region]);
                                } else {
                                  setSelectedRegions(selectedRegions.filter(r => r !== region));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{region}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {locationType === 'department' && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Rechercher un département..."
                        className="mb-2"
                      />
                      <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                        {Object.entries(REGIONS).filter(([key]) => key !== 'France entière').flatMap(([_, depts]) => depts).sort().map((dept) => (
                          <label key={dept} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDepartments.includes(dept)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDepartments([...selectedDepartments, dept]);
                                } else {
                                  setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{dept}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Secteurs d'activité</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {SECTORS.map((sector) => (
                      <label key={sector} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSectors.includes(sector)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSectors([...selectedSectors, sector]);
                            } else {
                              setSelectedSectors(selectedSectors.filter(s => s !== sector));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{sector}</span>
                      </label>
                    ))}
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
              <PodiumIcon className="h-7 w-7" />
            </h2>
            <Button
              size="sm"
              onClick={() => setShowContactForm(!showContactForm)}
              variant={showContactForm ? "outline" : "default"}
              disabled={personas.length >= 3}
            >
              {showContactForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {showContactForm ? 'Annuler' : personas.length >= 3 ? '3/3' : 'Ajouter'}
            </Button>
          </div>

          {personas.length < 3 && showContactForm && (
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

          {personas.length < 3 && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                <p className="mb-2">Vous devez créer 3 ciblages contacts pour continuer</p>
                <p className="text-sm">Ciblages créés : {personas.length}/3</p>
              </CardContent>
            </Card>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={personas.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {personas.map((persona, index) => (
                  <SortablePersonaCard
                    key={persona.id}
                    persona={persona}
                    index={index}
                    onDelete={handleDeleteContact}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default Targeting;
