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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  sender_email?: string;
  whatsapp_message?: string;
  whatsapp_audio_url?: string;
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
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchSequence();
      fetchSteps();
      fetchUserEmail();
    }
  }, [id]);

  const fetchUserEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.email) {
          setUserEmail(profile.email);
        } else {
          setUserEmail(user.email || '');
        }
      }
    } catch (error) {
      console.error('Error fetching user email:', error);
    }
  };

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
        sender_email: stepType === 'email' ? userEmail : null,
        whatsapp_message: stepType === 'whatsapp' ? '' : null,
        whatsapp_audio_url: stepType === 'whatsapp' ? null : null,
      };

      const { data, error } = await supabase
        .from('sequence_steps')
        .insert(newStep)
        .select()
        .single();

      if (error) throw error;

      const newStepData = data as SequenceStep;
      setSteps([...steps, newStepData]);
      setShowStepMenu(false);
      
      // Open edit sheet immediately for email and whatsapp steps
      if (stepType === 'email' || stepType === 'whatsapp') {
        setEditingStep(newStepData);
        setShowEditSheet(true);
      }
      
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
    if (step.delay_value === 0) return 'Envoyer immédiatement';
    const unitMap: Record<string, string> = {
      'minutes': step.delay_value === 1 ? 'minute' : 'minutes',
      'hours': step.delay_value === 1 ? 'heure' : 'heures',
      'days': step.delay_value === 1 ? 'jour' : 'jours',
    };
    const unit = unitMap[step.delay_unit] || step.delay_unit;
    return `Attendre ${step.delay_value} ${unit}`;
  };

  const isEmailStepIncomplete = (step: SequenceStep) => {
    return step.step_type === 'email' && (!step.email_subject || !step.email_body);
  };

  const isWhatsAppStepIncomplete = (step: SequenceStep) => {
    return step.step_type === 'whatsapp' && !step.whatsapp_message;
  };

  const isStepIncomplete = (step: SequenceStep) => {
    return isEmailStepIncomplete(step) || isWhatsAppStepIncomplete(step);
  };

  const insertVariable = (variable: string) => {
    if (!editingStep) return;
    const textarea = document.querySelector('textarea[name="email_body"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = editingStep.email_body || '';
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      setEditingStep({ ...editingStep, email_body: newText });
    }
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

          <div className="flex items-center gap-2">
            <Switch
              checked={sequence.is_active}
              onCheckedChange={(checked) => handleUpdateSequence({ is_active: checked })}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 bg-muted/20">
        <div className="max-w-2xl mx-auto">
          {/* Sequence Flow */}
          <div className="space-y-3">
            {/* Start Node */}
            <Card className="p-4 text-center bg-background border-2">
              <div className="text-sm font-medium text-muted-foreground">Début de la séquence</div>
            </Card>

            {/* Connector */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-border" />
            </div>

            {/* Steps */}
            {steps.map((step, index) => (
              <div key={step.id}>
                {/* Step Card */}
                <Card className={`p-4 border-2 ${isStepIncomplete(step) ? 'border-destructive' : 'border-border'} hover:shadow-md transition-shadow`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      <Clock className="h-3 w-3" />
                      <span>{getDelayText(step)}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      setEditingStep(step);
                      setShowEditSheet(true);
                    }}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                      {getStepIcon(step.step_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{getStepLabel(step.step_type)}</div>
                      {isStepIncomplete(step) && (
                        <div className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                          Paramétrage incomplet
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    <div className="w-0.5 h-6 bg-border" />
                  </div>
                )}
              </div>
            ))}

            {/* Add Step Button */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-border" />
            </div>

            <div className="flex justify-center relative">
              <DropdownMenu open={showStepMenu} onOpenChange={setShowStepMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full h-9 w-9 shadow-sm hover:shadow-md transition-shadow">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuItem onClick={() => handleAddStep('email')} className="cursor-pointer">
                    <Mail className="h-4 w-4 mr-2 text-primary" />
                    Envoyer un email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddStep('whatsapp')} className="cursor-pointer">
                    <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                    Envoyer un WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddStep('linkedin')} className="cursor-pointer">
                    <Linkedin className="h-4 w-4 mr-2 text-blue-500" />
                    Actions LinkedIn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Step Sheet */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingStep && getStepLabel(editingStep.step_type)}</SheetTitle>
          </SheetHeader>

          {editingStep && (
            <div className="space-y-6 mt-6">
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
                    <Label>Expéditeur</Label>
                    <Select
                      value={editingStep.sender_email || userEmail}
                      onValueChange={(value) => setEditingStep({ ...editingStep, sender_email: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un expéditeur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={userEmail}>{userEmail}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                    <div className="flex items-center justify-between">
                      <Label>Contenu</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Champs de fusion
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => insertVariable('prenom')}>
                            Prénom
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => insertVariable('nom')}>
                            Nom
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => insertVariable('entreprise')}>
                            Entreprise
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => insertVariable('poste')}>
                            Poste
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Textarea
                      name="email_body"
                      value={editingStep.email_body || ''}
                      onChange={(e) => setEditingStep({
                        ...editingStep,
                        email_body: e.target.value
                      })}
                      placeholder="Écrivez votre message..."
                      rows={12}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Utiliser un template
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* WhatsApp Specific Fields */}
              {editingStep.step_type === 'whatsapp' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Message</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Champs de fusion
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => insertVariable('prenom')}>
                            Prénom
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => insertVariable('nom')}>
                            Nom
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => insertVariable('entreprise')}>
                            Entreprise
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => insertVariable('poste')}>
                            Poste
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Textarea
                      name="whatsapp_message"
                      value={editingStep.whatsapp_message || ''}
                      onChange={(e) => setEditingStep({
                        ...editingStep,
                        whatsapp_message: e.target.value
                      })}
                      placeholder="Écrivez votre message WhatsApp..."
                      rows={12}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Message audio (optionnel)</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        Enregistrer un audio
                      </Button>
                      {editingStep.whatsapp_audio_url && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingStep({ ...editingStep, whatsapp_audio_url: undefined })}
                        >
                          Supprimer l'audio
                        </Button>
                      )}
                    </div>
                    {editingStep.whatsapp_audio_url && (
                      <div className="text-sm text-muted-foreground">
                        Audio enregistré
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Utiliser un template
                    </Button>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditSheet(false)}>
                  Annuler
                </Button>
                <Button onClick={() => {
                  handleUpdateStep(editingStep.id, {
                    delay_value: editingStep.delay_value,
                    delay_unit: editingStep.delay_unit,
                    email_subject: editingStep.email_subject,
                    email_body: editingStep.email_body,
                    sender_email: editingStep.sender_email,
                    whatsapp_message: editingStep.whatsapp_message,
                    whatsapp_audio_url: editingStep.whatsapp_audio_url,
                  });
                  setShowEditSheet(false);
                }}>
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SequenceEditor;
