import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Clock, Play, Pause, Send, PhoneCall, Calendar, TrendingUp, Inbox, Database } from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockLeads, mockCompanies, mockContacts } from '@/lib/mockData';

const Vision = () => {
  const navigate = useNavigate();

  // Calculer les données pour le dashboard
  const latestLeads = mockLeads
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3)
    .map(lead => {
      const company = mockCompanies.find(c => c.id === lead.companyId);
      const contacts = mockContacts.filter(c => c.companyId === lead.companyId);
      return { lead, company, contact: contacts[0] };
    });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Bandeau onboarding */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Bienvenue sur Yurican</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Vous êtes à 3 étapes du plein potentiel de la plateforme
              </p>
              <Progress value={40} className="w-64 h-2" />
            </div>
            <Button>Continuer la configuration</Button>
          </div>
        </CardContent>
      </Card>

      {/* Section Overview */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Aperçu général</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Daily tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tâches du jour</CardTitle>
              <Button variant="link" size="sm" onClick={() => navigate('/prospects')}>
                Voir tout →
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Appels</span>
                </div>
                <span className="text-2xl font-bold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Emails</span>
                </div>
                <span className="text-2xl font-bold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-destructive" />
                  <span className="text-sm">En retard</span>
                </div>
                <span className="text-2xl font-bold text-destructive">0</span>
              </div>
            </CardContent>
          </Card>

          {/* Current sequences */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/prospects')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Séquences en cours</CardTitle>
              <Button variant="link" size="sm">
                Gérer →
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-success" />
                  <span className="text-sm">Actives</span>
                </div>
                <span className="text-2xl font-bold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pause className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">En pause</span>
                </div>
                <span className="text-2xl font-bold">0</span>
              </div>
            </CardContent>
          </Card>

          {/* Weekly success */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Succès hebdomadaire</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Emails envoyés</span>
                </div>
                <span className="text-2xl font-bold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Appels passés</span>
                </div>
                <span className="text-2xl font-bold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Meetings</span>
                </div>
                <span className="text-2xl font-bold">0</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section What's new */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quoi de neuf ?</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Latest leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Derniers leads</CardTitle>
              <Button variant="link" size="sm" onClick={() => navigate('/prospects')}>
                Voir tout →
              </Button>
            </CardHeader>
            <CardContent>
              {latestLeads.length > 0 ? (
                <div className="space-y-4">
                  {latestLeads.map(({ lead, company, contact }) => (
                    <div key={lead.id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {company?.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{company?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact?.fullName || 'Pas de contact'}
                        </p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Inbox}
                  title="Aucun lead"
                  description="Commencez par ajouter des entreprises depuis la page Marché."
                  action={{
                    label: 'Voir les entreprises',
                    onClick: () => navigate('/marche')
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Hot leads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads chauds</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={TrendingUp}
                title="Aucun lead chaud"
                description="Les leads avec une forte probabilité de conversion apparaîtront ici."
              />
            </CardContent>
          </Card>

          {/* New data available */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Nouvelles données</CardTitle>
              <Button variant="link" size="sm" onClick={() => navigate('/marche')}>
                Rechercher →
              </Button>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Database}
                title="Pas de nouvelles données"
                description="Les mises à jour sur vos entreprises apparaîtront ici."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Vision;
