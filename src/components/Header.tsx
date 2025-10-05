import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Target, Coins } from "lucide-react";
import { useTargeting } from "@/contexts/TargetingContext";

const Header = () => {
  const navigate = useNavigate();
  const { activeTargeting, credits } = useTargeting();

  return (
    <header className="h-14 border-b border-border flex items-center px-6 bg-background sticky top-0 z-10">
      <SidebarTrigger />
      <div className="ml-auto flex items-center gap-3">
        {activeTargeting && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {activeTargeting.name}
            </Badge>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/targeting')}
        >
          <Target className="h-4 w-4 mr-2" />
          Ciblage
        </Button>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Coins className="h-3 w-3" />
          {credits} crédits
        </Badge>
        <div className="text-sm text-muted-foreground">Client Enterprise</div>
      </div>
    </header>
  );
};

export default Header;
