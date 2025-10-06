import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Briefcase, Target, Users, Wrench, Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Profile {
  job_function: string | null;
  job_level: string | null;
  growth_type: string | null;
  product_description: string | null;
  peak_activity_period: string | null;
  company_name: string | null;
  company_siret: string | null;
  company_type: string | null;
  company_address: string | null;
  crm_tool: string | null;
  other_tools: string[] | null;
  tracked_events: string[] | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-background via-background to-primary/5 min-h-full">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          <Button onClick={() => navigate('/onboarding')}>
            <Edit className="w-4 h-4 mr-2" />
            Refaire l'onboarding
          </Button>
        </div>

            {/* Qui vous êtes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Qui vous êtes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fonction</p>
                    <p className="text-base">{profile?.job_function || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Niveau</p>
                    <p className="text-base">{profile?.job_level || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type de croissance</p>
                    <p className="text-base">{profile?.growth_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Période d'activité</p>
                    <p className="text-base">{profile?.peak_activity_period || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Produit/Service</p>
                  <p className="text-base">{profile?.product_description || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Entreprise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Votre entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nom</p>
                    <p className="text-base">{profile?.company_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">SIRET</p>
                    <p className="text-base">{profile?.company_siret || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="text-base">{profile?.company_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p className="text-base">{profile?.company_address || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Outils */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Vos outils
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">CRM</p>
                  <p className="text-base">{profile?.crm_tool || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Autres outils</p>
                  <div className="flex flex-wrap gap-2">
                    {profile?.other_tools && profile.other_tools.length > 0 ? (
                      profile.other_tools.map((tool) => (
                        <Badge key={tool} variant="secondary">
                          {tool}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-base text-muted-foreground">Aucun outil configuré</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* Actualités suivies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Actualités suivies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile?.tracked_events && profile.tracked_events.length > 0 ? (
                profile.tracked_events.map((event) => (
                  <Badge key={event} variant="secondary">
                    {event}
                  </Badge>
                ))
              ) : (
                <p className="text-base text-muted-foreground">Aucune actualité configurée</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
