import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Target, Coins, ChevronDown, Plus, Bell, LogOut } from "lucide-react";
import { useTargeting } from "@/contexts/TargetingContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  useEffect(() => {
    const loadTargetings = async () => {
      setLoadingTargetings(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingTargetings(false);
        return;
      }

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
    navigate('/login');
  };

  const displayedTargetings = showAll ? allTargetings : allTargetings.slice(0, 3);

  return (
    <header className="h-14 border-b border-border flex items-center px-6 bg-background sticky top-0 z-10">
      <SidebarTrigger />
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
        
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </header>
  );
};

export default Header;
