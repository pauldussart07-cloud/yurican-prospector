import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useActions } from '@/contexts/ActionsContext';
import { Mail, Video, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ParametrageMobile = () => {
  const { toast } = useToast();
  const { actions, updateAction } = useActions();
  const [activeTab, setActiveTab] = useState('action-1');

  const handleSaveActions = () => {
    toast({
      title: 'Actions sauvegardées',
      description: 'Vos actions ont été mises à jour avec succès.',
    });
  };

  const currentAction = actions.find(a => a.id === parseInt(activeTab.split('-')[1]));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Paramétrage Mobile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration des Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="action-1">Action 1</TabsTrigger>
              <TabsTrigger value="action-2">Action 2</TabsTrigger>
              <TabsTrigger value="action-3">Action 3</TabsTrigger>
            </TabsList>
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="action-4">Action 4</TabsTrigger>
              <TabsTrigger value="action-5">Action 5</TabsTrigger>
              <TabsTrigger value="action-6">Action 6</TabsTrigger>
            </TabsList>

            {actions.map((action) => (
              <TabsContent key={action.id} value={`action-${action.id}`}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`action-name-${action.id}`}>Nom de l'action</Label>
                    <Input
                      id={`action-name-${action.id}`}
                      value={action.name}
                      onChange={(e) => updateAction(action.id, { name: e.target.value })}
                      placeholder="Nom de l'action"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`action-type-${action.id}`}>Type d'action</Label>
                    <Select
                      value={action.type}
                      onValueChange={(value: 'email' | 'meeting') => 
                        updateAction(action.id, { type: value })
                      }
                    >
                      <SelectTrigger id={`action-type-${action.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="meeting">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Réunion
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {action.type === 'email' && (
                    <>
                      <div>
                        <Label htmlFor={`email-subject-${action.id}`}>Objet de l'email</Label>
                        <Input
                          id={`email-subject-${action.id}`}
                          value={action.emailSubject || ''}
                          onChange={(e) => updateAction(action.id, { emailSubject: e.target.value })}
                          placeholder="Objet de l'email"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`email-body-${action.id}`}>Corps de l'email</Label>
                        <Textarea
                          id={`email-body-${action.id}`}
                          value={action.emailBody || ''}
                          onChange={(e) => updateAction(action.id, { emailBody: e.target.value })}
                          placeholder="Contenu de l'email..."
                          rows={6}
                        />
                        <div className="text-xs text-muted-foreground mt-2">
                          Variables disponibles: {'{nom}'}, {'{entreprise}'}, {'{role}'}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`email-attachment-${action.id}`}>Pièce jointe (optionnel)</Label>
                        <Input
                          id={`email-attachment-${action.id}`}
                          value={action.emailAttachment || ''}
                          onChange={(e) => updateAction(action.id, { emailAttachment: e.target.value })}
                          placeholder="URL ou chemin du fichier"
                        />
                      </div>
                    </>
                  )}

                  {action.type === 'meeting' && (
                    <div>
                      <Label htmlFor={`meeting-platform-${action.id}`}>Plateforme de réunion</Label>
                      <Select
                        value={action.meetingPlatform || 'teams'}
                        onValueChange={(value: 'teams' | 'google-meet') => 
                          updateAction(action.id, { meetingPlatform: value })
                        }
                      >
                        <SelectTrigger id={`meeting-platform-${action.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                          <SelectItem value="google-meet">Google Meet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <Button onClick={handleSaveActions} className="w-full mt-6">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder les actions
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Actions Email :</strong> Configurez vos modèles d'emails pour la prospection, 
              le suivi et la relance. Utilisez les variables pour personnaliser automatiquement vos messages.
            </p>
            <p>
              <strong>Actions Réunion :</strong> Configurez vos plateformes de réunion préférées 
              (Teams ou Google Meet) pour créer rapidement des RDV.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParametrageMobile;
