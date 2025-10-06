import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Mail, Calendar } from 'lucide-react';
import { useTargeting } from '@/contexts/TargetingContext';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { credits } = useTargeting();
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setCreatedAt(new Date(user.created_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }));
      }
      setLoading(false);
    };

    loadUserInfo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Déconnexion réussie',
      description: 'À bientôt !',
    });
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const initials = email ? email.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>
      
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">{email}</CardTitle>
          <CardDescription>Compte Yurican</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Membre depuis</p>
              <p className="text-sm text-muted-foreground">{createdAt}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-5 w-5 flex items-center justify-center">
              <span className="text-lg">💰</span>
            </div>
            <div>
              <p className="text-sm font-medium">Crédits disponibles</p>
              <p className="text-sm text-muted-foreground">{credits} crédits</p>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleLogout} 
              variant="destructive" 
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
