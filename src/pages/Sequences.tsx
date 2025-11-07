import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Sequence {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  step_count?: number;
}

const Sequences = () => {
  const navigate = useNavigate();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sequencesData, error } = await supabase
        .from('sequences')
        .select(`
          id,
          name,
          is_active,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch step counts for each sequence
      const sequencesWithCounts = await Promise.all(
        (sequencesData || []).map(async (seq) => {
          const { count } = await supabase
            .from('sequence_steps')
            .select('*', { count: 'exact', head: true })
            .eq('sequence_id', seq.id);

          return { ...seq, step_count: count || 0 };
        })
      );

      setSequences(sequencesWithCounts);
    } catch (error) {
      console.error('Error fetching sequences:', error);
      toast.error('Erreur lors du chargement des séquences');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSequence = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newSequence = {
        user_id: user.id,
        name: `Nouvelle séquence - ${format(new Date(), 'dd/MM/yyyy - HH:mm', { locale: fr })}`,
        is_active: false,
      };

      const { data, error } = await supabase
        .from('sequences')
        .insert(newSequence)
        .select()
        .single();

      if (error) throw error;

      toast.success('Séquence créée');
      navigate(`/sequences/${data.id}`);
    } catch (error) {
      console.error('Error creating sequence:', error);
      toast.error('Erreur lors de la création de la séquence');
    }
  };

  const handleDuplicateSequence = async (sequenceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch original sequence
      const { data: original, error: fetchError } = await supabase
        .from('sequences')
        .select('*')
        .eq('id', sequenceId)
        .single();

      if (fetchError) throw fetchError;

      // Create duplicate
      const { data: duplicate, error: createError } = await supabase
        .from('sequences')
        .insert({
          user_id: user.id,
          name: `${original.name} (copie)`,
          is_active: false,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Fetch and duplicate steps
      const { data: steps, error: stepsError } = await supabase
        .from('sequence_steps')
        .select('*')
        .eq('sequence_id', sequenceId);

      if (stepsError) throw stepsError;

      if (steps && steps.length > 0) {
        const duplicateSteps = steps.map(step => ({
          sequence_id: duplicate.id,
          step_order: step.step_order,
          step_type: step.step_type,
          delay_value: step.delay_value,
          delay_unit: step.delay_unit,
          email_subject: step.email_subject,
          email_body: step.email_body,
        }));

        const { error: insertStepsError } = await supabase
          .from('sequence_steps')
          .insert(duplicateSteps);

        if (insertStepsError) throw insertStepsError;
      }

      toast.success('Séquence dupliquée');
      fetchSequences();
    } catch (error) {
      console.error('Error duplicating sequence:', error);
      toast.error('Erreur lors de la duplication');
    }
  };

  const handleDeleteSequence = async (sequenceId: string) => {
    try {
      const { error } = await supabase
        .from('sequences')
        .delete()
        .eq('id', sequenceId);

      if (error) throw error;

      toast.success('Séquence supprimée');
      fetchSequences();
    } catch (error) {
      console.error('Error deleting sequence:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredSequences = sequences.filter(seq =>
    seq.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Séquences</h1>
          <p className="text-muted-foreground">
            Vous êtes limité à un maximum de 2 séquences dans un plan basic
          </p>
        </div>

        {/* Search and Create Button */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sequence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCreateSequence} className="gap-2">
            <Plus className="h-4 w-4" />
            Create a new sequence
          </Button>
        </div>

        {/* Sequences List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Chargement...
          </div>
        ) : filteredSequences.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              {searchQuery ? 'Aucune séquence trouvée' : 'Aucune séquence créée'}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSequences.map((sequence) => (
              <Card
                key={sequence.id}
                className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/sequences/${sequence.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">
                          {sequence.name}
                        </h3>
                        {sequence.is_active && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Stats</span>
                        <span>Creator GB</span>
                        <span>Leads {sequence.step_count || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateSequence(sequence.id);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSequence(sequence.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sequences;
