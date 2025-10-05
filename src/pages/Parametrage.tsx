import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Calendar, Plus } from 'lucide-react';

interface ActionConfig {
  id: number;
  name: string;
  type: 'email' | 'meeting';
  emailSubject?: string;
  emailBody?: string;
  emailAttachment?: string;
  meetingPlatform?: 'teams' | 'google-meet';
}

const Parametrage = () => {
  const { toast } = useToast();
  const [hideNoGo, setHideNoGo] = useState(true);
  const [defaultContactCount, setDefaultContactCount] = useState(3);
  const [actions, setActions] = useState<ActionConfig[]>([
    { id: 1, name: 'Action 1', type: 'email', emailSubject: '', emailBody: '' },
    { id: 2, name: 'Action 2', type: 'email', emailSubject: '', emailBody: '' },
    { id: 3, name: 'Action 3', type: 'email', emailSubject: '', emailBody: '' },
    { id: 4, name: 'Action 4', type: 'meeting', meetingPlatform: 'teams' },
    { id: 5, name: 'Action 5', type: 'meeting', meetingPlatform: 'google-meet' },
    { id: 6, name: 'Action 6', type: 'email', emailSubject: '', emailBody: '' },
  ]);
  const [selectedAction, setSelectedAction] = useState<number>(1);

  const variables = [
    { label: 'Nom de l\'entreprise', value: '{company_name}' },
    { label: 'Secteur', value: '{company_sector}' },
    { label: 'CA', value: '{company_ca}' },
    { label: 'Effectif', value: '{company_headcount}' },
    { label: 'Nom du contact', value: '{contact_name}' },
    { label: 'Email du contact', value: '{contact_email}' },
    { label: 'Rôle du contact', value: '{contact_role}' },
    { label: 'Téléphone du contact', value: '{contact_phone}' },
  ];

  const handleSeedReset = () => {
    toast({
      title: 'Réinitialisation des données',
      description: 'Les données ont été réinitialisées avec succès.',
    });
  };

  const updateAction = (id: number, updates: Partial<ActionConfig>) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, ...updates } : action
    ));
  };

  const insertVariable = (variable: string) => {
    const currentAction = actions.find(a => a.id === selectedAction);
    if (currentAction && currentAction.type === 'email') {
      const currentBody = currentAction.emailBody || '';
      updateAction(selectedAction, {
        emailBody: currentBody + variable
      });
    }
  };

  const handleSaveActions = () => {
    toast({
      title: 'Actions sauvegardées',
      description: 'Les paramètres des actions ont été enregistrés avec succès.',
    });
  };

  const currentAction = actions.find(a => a.id === selectedAction);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Paramétrage</h1>
        <p className="text-muted-foreground">Gérez les paramètres de votre application</p>
      </div>

      {/* Paramètres généraux */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres généraux</CardTitle>
          <CardDescription>Configuration de l'affichage et du comportement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hide-no-go">Masquer les entreprises NO GO</Label>
              <p className="text-sm text-muted-foreground">
                Les entreprises marquées comme NO GO ne seront pas affichées dans la liste
              </p>
            </div>
            <Switch
              id="hide-no-go"
              checked={hideNoGo}
              onCheckedChange={setHideNoGo}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-contacts">Nombre de contacts par défaut</Label>
            <Input
              id="default-contacts"
              type="number"
              min={1}
              max={10}
              value={defaultContactCount}
              onChange={(e) => setDefaultContactCount(parseInt(e.target.value) || 1)}
              className="w-32"
            />
            <p className="text-sm text-muted-foreground">
              Nombre de contacts à générer par défaut lors de l'ajout d'une entreprise
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Intégrations */}
      <Card>
        <CardHeader>
          <CardTitle>Intégrations</CardTitle>
          <CardDescription>Connectez vos services externes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center font-bold">
                SI
              </div>
              <div>
                <h4 className="font-medium">SocieteInfo</h4>
                <p className="text-sm text-muted-foreground">API de données d'entreprises</p>
              </div>
            </div>
            <Badge variant="secondary">Non configuré</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center font-bold">
                📧
              </div>
              <div>
                <h4 className="font-medium">Email Provider</h4>
                <p className="text-sm text-muted-foreground">Service d'envoi d'emails</p>
              </div>
            </div>
            <Badge variant="secondary">Non configuré</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center font-bold">
                📰
              </div>
              <div>
                <h4 className="font-medium">News API</h4>
                <p className="text-sm text-muted-foreground">Actualités d'entreprises</p>
              </div>
            </div>
            <Badge variant="secondary">Non configuré</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres d'actions */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres d'actions</CardTitle>
          <CardDescription>
            Configurez les 6 actions disponibles dans la page Prospects et les fiches de contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedAction.toString()} onValueChange={(v) => setSelectedAction(Number(v))}>
            <TabsList className="grid grid-cols-6 w-full">
              {actions.map(action => (
                <TabsTrigger key={action.id} value={action.id.toString()}>
                  {action.type === 'email' ? <Mail className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                </TabsTrigger>
              ))}
            </TabsList>

            {actions.map(action => (
              <TabsContent key={action.id} value={action.id.toString()} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor={`action-name-${action.id}`}>Nom de l'action</Label>
                  <Input
                    id={`action-name-${action.id}`}
                    value={action.name}
                    onChange={(e) => updateAction(action.id, { name: e.target.value })}
                    placeholder="Ex: Envoyer email de prospection"
                  />
                </div>

                <div className="space-y-2">
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
                          <span>Envoyer un email</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="meeting">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Créer un rendez-vous</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {action.type === 'email' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`email-subject-${action.id}`}>Objet de l'email</Label>
                      <Input
                        id={`email-subject-${action.id}`}
                        value={action.emailSubject || ''}
                        onChange={(e) => updateAction(action.id, { emailSubject: e.target.value })}
                        placeholder="Ex: Proposition de collaboration avec {company_name}"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`email-body-${action.id}`}>Corps de l'email</Label>
                        <div className="flex gap-1">
                          {variables.map((variable) => (
                            <Button
                              key={variable.value}
                              variant="ghost"
                              size="sm"
                              onClick={() => insertVariable(variable.value)}
                              className="h-7 text-xs"
                              title={variable.label}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {variable.value}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        id={`email-body-${action.id}`}
                        value={action.emailBody || ''}
                        onChange={(e) => updateAction(action.id, { emailBody: e.target.value })}
                        placeholder="Bonjour {contact_name},&#10;&#10;Je me permets de vous contacter concernant {company_name}...&#10;&#10;Cordialement"
                        className="min-h-[200px] font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Utilisez les boutons ci-dessus pour insérer des variables personnalisées
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`email-attachment-${action.id}`}>Pièce jointe (URL ou chemin)</Label>
                      <Input
                        id={`email-attachment-${action.id}`}
                        value={action.emailAttachment || ''}
                        onChange={(e) => updateAction(action.id, { emailAttachment: e.target.value })}
                        placeholder="Ex: https://monsite.com/brochure.pdf"
                      />
                    </div>
                  </>
                )}

                {action.type === 'meeting' && (
                  <div className="space-y-2">
                    <Label htmlFor={`meeting-platform-${action.id}`}>Plateforme de visioconférence</Label>
                    <Select
                      value={action.meetingPlatform}
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
                    <p className="text-xs text-muted-foreground">
                      L'intégration avec la plateforme sélectionnée doit être configurée dans la section Intégrations
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveActions}>
              Sauvegarder les actions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Données */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion des données</CardTitle>
          <CardDescription>Réinitialisez ou exportez vos données</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Réinitialiser les données</h4>
              <p className="text-sm text-muted-foreground">
                Restaure les données d'exemple initiales
              </p>
            </div>
            <Button variant="outline" onClick={handleSeedReset}>
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Variables d'environnement */}
      <Card>
        <CardHeader>
          <CardTitle>Variables d'environnement</CardTitle>
          <CardDescription>
            Configurez vos clés API (voir .env.example pour plus de détails)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="societe-info-key">SOCIETEINFO_API_KEY</Label>
            <Input
              id="societe-info-key"
              type="password"
              placeholder="Votre clé API SocieteInfo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="news-api-key">NEWS_API_KEY</Label>
            <Input
              id="news-api-key"
              type="password"
              placeholder="Votre clé API News"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-key">EMAIL_PROVIDER_KEY</Label>
            <Input
              id="email-key"
              type="password"
              placeholder="Votre clé API Email Provider"
            />
          </div>

          <Button>Sauvegarder les clés</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Parametrage;
