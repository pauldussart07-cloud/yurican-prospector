import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Target, Coins, ChevronDown, Plus, Bell, LogOut, User, Mail, Calendar } from "lucide-react";
import { useTargeting } from "@/contexts/TargetingContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Targeting {
  id: string;
  name: string;
  is_active: boolean;
}

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeTargeting, setActiveTargeting, credits } = useTargeting();
  const [allTargetings, setAllTargetings] = useState<Targeting[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loadingTargetings, setLoadingTargetings] = useState(true);
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const loadTargetings = async () => {
      setLoadingTargetings(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingTargetings(false);
        return;
      }

      setEmail(user.email || '');
      setCreatedAt(new Date(user.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }));

      const { data } = await supabase
        .from('targetings')
        .select('id, name, is_active')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setAllTargetings(data);
      }
      setLoadingTargetings(false);
    };

    loadTargetings();
  }, []);

  const handleTargetingChange = async (targeting: Targeting) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Désactiver tous les ciblages
    await supabase
      .from('targetings')
      .update({ is_active: false })
      .eq('user_id', user.id);

    // Activer le ciblage sélectionné
    await supabase
      .from('targetings')
      .update({ is_active: true })
      .eq('id', targeting.id);

    setActiveTargeting(targeting as any);
    setShowAll(false);
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Déconnexion réussie',
      description: 'À bientôt !',
    });
    setProfileOpen(false);
    navigate('/login');
  };

  const displayedTargetings = showAll ? allTargetings : allTargetings.slice(0, 3);
  const initials = email ? email.substring(0, 2).toUpperCase() : 'U';

  return (
    <header className="h-14 border-b border-sidebar-border flex items-center px-3 bg-header text-header-foreground sticky top-0 z-10">
      <SidebarTrigger className="text-header-foreground" />
      <div className="ml-auto flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Target className="h-4 w-4" />
              {activeTargeting ? activeTargeting.name : "Sélectionner un ciblage"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {loadingTargetings ? (
              <DropdownMenuItem disabled>
                Chargement...
              </DropdownMenuItem>
            ) : allTargetings.length === 0 ? (
              <>
                <DropdownMenuItem disabled className="text-muted-foreground text-sm">
                  Aucun ciblage créé
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/targeting')}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre premier ciblage
                </DropdownMenuItem>
              </>
            ) : (
              <>
                {displayedTargetings.map((targeting) => (
                  <DropdownMenuItem
                    key={targeting.id}
                    onClick={() => handleTargetingChange(targeting)}
                    className="cursor-pointer"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    {targeting.name}
                    {targeting.is_active && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Actif
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
                {!showAll && allTargetings.length > 3 && (
                  <DropdownMenuItem
                    onClick={() => setShowAll(true)}
                    className="cursor-pointer"
                  >
                    Voir tous ({allTargetings.length})
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/targeting')}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau ciblage
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>

        <Badge variant="secondary" className="flex items-center gap-1">
          <Coins className="h-3 w-3" />
          {credits} crédits
        </Badge>
        
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              Profil
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <DialogTitle className="text-center text-2xl">{email}</DialogTitle>
              <DialogDescription className="text-center">Compte Yurican</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-4">
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
                <Coins className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Crédits disponibles</p>
                  <p className="text-sm text-muted-foreground">{credits} crédits</p>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleLogout} 
                  variant="destructive" 
                  className="w-full gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
};

export default Header;
