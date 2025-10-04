import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const Setup = () => {
  const { toast } = useToast();
  const [hideNoGo, setHideNoGo] = useState(true);
  const [defaultContactCount, setDefaultContactCount] = useState(3);

  const handleSeedReset = () => {
    toast({
      title: 'Réinitialisation des données',
      description: 'Les données ont été réinitialisées avec succès.',
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuration</h1>
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

export default Setup;
