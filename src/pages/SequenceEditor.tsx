import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Settings, MoreVertical, Plus, Clock, Mail, MessageCircle, Linkedin, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SequenceStep {
  id: string;
  step_order: number;
  step_type: 'email' | 'whatsapp' | 'linkedin';
  delay_value: number;
  delay_unit: 'minutes' | 'hours' | 'days';
  email_subject?: string;
  email_body?: string;
}

interface Sequence {
  id: string;
  name: string;
  is_active: boolean;
}

const SequenceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [showStepMenu, setShowStepMenu] = useState(false);
  const [editingStep, setEditingStep] = useState<SequenceStep | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSequence();
      fetchSteps();
    }
  }, [id]);

  const fetchSequence = async () => {
    try {
      const { data, error } = await supabase
        .from('sequences')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSequence(data);
    } catch (error) {
      console.error('Error fetching sequence:', error);
      toast.error('Erreur lors du chargement');
    }
  };

  const fetchSteps = async () => {
    try {
      const { data, error } = await supabase
        .from('sequence_steps')
        .select('*')
        .eq('sequence_id', id)
        .order('step_order', { ascending: true });

      if (error) throw error;
      setSteps((data || []) as SequenceStep[]);
    } catch (error) {
      console.error('Error fetching steps:', error);
    }
  };

  const handleUpdateSequence = async (updates: Partial<Sequence>) => {
    try {
      const { error } = await supabase
        .from('sequences')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setSequence(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Séquence mise à jour');
    } catch (error) {
      console.error('Error updating sequence:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleAddStep = async (stepType: 'email' | 'whatsapp' | 'linkedin') => {
    try {
      const newStep = {
        sequence_id: id,
        step_order: steps.length,
        step_type: stepType,
        delay_value: 0,
        delay_unit: 'days' as const,
        email_subject: stepType === 'email' ? '' : null,
        email_body: stepType === 'email' ? '' : null,
      };

      const { data, error } = await supabase
        .from('sequence_steps')
        .insert(newStep)
        .select()
        .single();

      if (error) throw error;

      setSteps([...steps, data as SequenceStep]);
      setShowStepMenu(false);
      toast.success('Étape ajoutée');
    } catch (error) {
      console.error('Error adding step:', error);
      toast.error('Erreur lors de l\'ajout de l\'étape');
    }
  };

  const handleUpdateStep = async (stepId: string, updates: Partial<SequenceStep>) => {
    try {
      const { error } = await supabase
        .from('sequence_steps')
        .update(updates)
        .eq('id', stepId);

      if (error) throw error;

      setSteps(steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ));
      toast.success('Étape mise à jour');
    } catch (error) {
      console.error('Error updating step:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      const { error } = await supabase
        .from('sequence_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;

      setSteps(steps.filter(step => step.id !== stepId));
      toast.success('Étape supprimée');
    } catch (error) {
      console.error('Error deleting step:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-primary" />;
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'linkedin':
        return <Linkedin className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStepLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'whatsapp':
        return 'WhatsApp';
      case 'linkedin':
        return 'Actions LinkedIn';
      default:
        return type;
    }
  };

  const getDelayText = (step: SequenceStep) => {
    if (step.delay_value === 0) return 'Send immediately';
    const unit = step.delay_value === 1 
      ? step.delay_unit.slice(0, -1) 
      : step.delay_unit;
    return `Wait for ${step.delay_value} ${unit}`;
  };

  if (!sequence) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/sequences')}>
              <X className="h-5 w-5" />
            </Button>
            <Input
              value={sequence.name}
              onChange={(e) => handleUpdateSequence({ name: e.target.value })}
              className="max-w-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={sequence.is_active}
                onCheckedChange={(checked) => handleUpdateSequence({ is_active: checked })}
              />
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
            <Button>Next step →</Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Sequence Flow */}
          <div className="space-y-4">
            {/* Start Node */}
            <Card className="p-6 text-center bg-muted/50">
              <div className="font-medium text-muted-foreground">Sequence start</div>
            </Card>

            {/* Connector */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-border" />
            </div>

            {/* Steps */}
            {steps.map((step, index) => (
              <div key={step.id}>
                {/* Step Card */}
                <Card className={`p-6 border-2 ${step.step_type === 'email' && !step.email_subject ? 'border-destructive' : 'border-primary'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Clock className="h-4 w-4" />
                      <span>{getDelayText(step)}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingStep(step);
                      setShowEditDialog(true);
                    }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                      {getStepIcon(step.step_type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{getStepLabel(step.step_type)}</div>
                      {step.step_type === 'email' && !step.email_subject && (
                        <div className="text-sm text-destructive">Action needed</div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>

                {/* Connector */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-0.5 h-8 bg-border" />
                  </div>
                )}
              </div>
            ))}

            {/* Add Step Button */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-border" />
            </div>

            <div className="flex justify-center relative">
              <DropdownMenu open={showStepMenu} onOpenChange={setShowStepMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                    <Plus className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem onClick={() => handleAddStep('email')}>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer un email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddStep('whatsapp')}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Envoyer un WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddStep('linkedin')}>
                    <Linkedin className="h-4 w-4 mr-2" />
                    Actions LinkedIn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Step Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStep && getStepLabel(editingStep.step_type)}</DialogTitle>
          </DialogHeader>

          {editingStep && (
            <div className="space-y-6">
              {/* Delay Settings */}
              <div className="space-y-2">
                <Label>Délai d'attente</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={editingStep.delay_value}
                    onChange={(e) => setEditingStep({
                      ...editingStep,
                      delay_value: parseInt(e.target.value) || 0
                    })}
                    className="w-24"
                  />
                  <Select
                    value={editingStep.delay_unit}
                    onValueChange={(value: 'minutes' | 'hours' | 'days') =>
                      setEditingStep({ ...editingStep, delay_unit: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">minutes</SelectItem>
                      <SelectItem value="hours">heures</SelectItem>
                      <SelectItem value="days">jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Email Specific Fields */}
              {editingStep.step_type === 'email' && (
                <>
                  <div className="space-y-2">
                    <Label>Objet</Label>
                    <Input
                      value={editingStep.email_subject || ''}
                      onChange={(e) => setEditingStep({
                        ...editingStep,
                        email_subject: e.target.value
                      })}
                      placeholder="Entrez l'objet de l'email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Corps de l'email</Label>
                    <Textarea
                      value={editingStep.email_body || ''}
                      onChange={(e) => setEditingStep({
                        ...editingStep,
                        email_body: e.target.value
                      })}
                      placeholder="Écrivez votre message..."
                      rows={8}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={() => {
                  handleUpdateStep(editingStep.id, {
                    delay_value: editingStep.delay_value,
                    delay_unit: editingStep.delay_unit,
                    email_subject: editingStep.email_subject,
                    email_body: editingStep.email_body,
                  });
                  setShowEditDialog(false);
                }}>
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SequenceEditor;
