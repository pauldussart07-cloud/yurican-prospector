import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTargeting } from '@/contexts/TargetingContext';
import { Plus, Trash2, Check } from 'lucide-react';

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

const Targeting = () => {
  const { toast } = useToast();
  const { activeTargeting, setActiveTargeting } = useTargeting();
  const [targetings, setTargetings] = useState<Targeting[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [departments, setDepartments] = useState('');
  const [sectors, setSectors] = useState('');
  const [minHeadcount, setMinHeadcount] = useState('');
  const [maxHeadcount, setMaxHeadcount] = useState('');
  const [minRevenue, setMinRevenue] = useState('');
  const [maxRevenue, setMaxRevenue] = useState('');

  useEffect(() => {
    loadTargetings();
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
      // Reset form
      setName('');
      setDepartments('');
      setSectors('');
      setMinHeadcount('');
      setMaxHeadcount('');
      setMinRevenue('');
      setMaxRevenue('');
      loadTargetings();
    }
  };

  const handleActivateTargeting = async (targetingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Désactiver tous les ciblages
    await supabase
      .from('targetings')
      .update({ is_active: false })
      .eq('user_id', user.id);

    // Activer le ciblage sélectionné
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold">Ciblage</h1>

      {/* Create new targeting */}
      <Card>
        <CardHeader>
          <CardTitle>Créer un nouveau ciblage</CardTitle>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departments">Départements (séparés par des virgules)</Label>
              <Input
                id="departments"
                value={departments}
                onChange={(e) => setDepartments(e.target.value)}
                placeholder="75, 69, 33"
              />
            </div>

            <div>
              <Label htmlFor="sectors">Secteurs d'activité (séparés par des virgules)</Label>
              <Input
                id="sectors"
                value={sectors}
                onChange={(e) => setSectors(e.target.value)}
                placeholder="Technologies, Conseil, Finance"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minHeadcount">Effectif minimum</Label>
              <Input
                id="minHeadcount"
                type="number"
                value={minHeadcount}
                onChange={(e) => setMinHeadcount(e.target.value)}
                placeholder="50"
              />
            </div>

            <div>
              <Label htmlFor="maxHeadcount">Effectif maximum</Label>
              <Input
                id="maxHeadcount"
                type="number"
                value={maxHeadcount}
                onChange={(e) => setMaxHeadcount(e.target.value)}
                placeholder="500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minRevenue">Chiffre d'affaires min (M€)</Label>
              <Input
                id="minRevenue"
                type="number"
                value={minRevenue}
                onChange={(e) => setMinRevenue(e.target.value)}
                placeholder="5"
              />
            </div>

            <div>
              <Label htmlFor="maxRevenue">Chiffre d'affaires max (M€)</Label>
              <Input
                id="maxRevenue"
                type="number"
                value={maxRevenue}
                onChange={(e) => setMaxRevenue(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>

          <Button onClick={handleCreateTargeting} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Créer le ciblage
          </Button>
        </CardContent>
      </Card>

      {/* List of existing targetings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Mes ciblages</h2>
        {targetings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Aucun ciblage créé
            </CardContent>
          </Card>
        ) : (
          targetings.map((targeting) => (
            <Card key={targeting.id} className={targeting.is_active ? 'border-primary' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{targeting.name}</h3>
                      {targeting.is_active && (
                        <Badge variant="default">
                          <Check className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                      {targeting.departments.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Départements:</span>{' '}
                          <span className="font-medium">{targeting.departments.join(', ')}</span>
                        </div>
                      )}
                      {targeting.sectors.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Secteurs:</span>{' '}
                          <span className="font-medium">{targeting.sectors.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      {targeting.min_headcount && (
                        <div>
                          <span className="text-muted-foreground">Effectif min:</span>{' '}
                          <span className="font-medium">{targeting.min_headcount}</span>
                        </div>
                      )}
                      {targeting.max_headcount && (
                        <div>
                          <span className="text-muted-foreground">Effectif max:</span>{' '}
                          <span className="font-medium">{targeting.max_headcount}</span>
                        </div>
                      )}
                      {targeting.min_revenue && (
                        <div>
                          <span className="text-muted-foreground">CA min:</span>{' '}
                          <span className="font-medium">{(targeting.min_revenue / 1000000).toFixed(1)}M€</span>
                        </div>
                      )}
                      {targeting.max_revenue && (
                        <div>
                          <span className="text-muted-foreground">CA max:</span>{' '}
                          <span className="font-medium">{(targeting.max_revenue / 1000000).toFixed(1)}M€</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
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
  );
};

export default Targeting;
