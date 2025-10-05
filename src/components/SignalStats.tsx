import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Target } from 'lucide-react';

interface SignalStatsProps {
  undiscovered: number;
  discoveredNoContacts: number;
  withContacts: number;
  onUndiscoveredClick?: () => void;
  onDiscoveredNoContactsClick?: () => void;
  onWithContactsClick?: () => void;
}

export function SignalStats({ 
  undiscovered, 
  discoveredNoContacts, 
  withContacts,
  onUndiscoveredClick,
  onDiscoveredNoContactsClick,
  onWithContactsClick
}: SignalStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Prospects chauds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div 
          className={`space-y-2 ${onUndiscoveredClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          onClick={onUndiscoveredClick}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Nouveau = {undiscovered}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-warning rounded-full h-2" style={{ width: '100%' }} />
          </div>
        </div>

        <div 
          className={`space-y-2 ${onDiscoveredNoContactsClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          onClick={onDiscoveredNoContactsClick}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>A traiter = {discoveredNoContacts}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-secondary rounded-full h-2" style={{ width: '100%' }} />
          </div>
        </div>

        <div 
          className={`space-y-2 ${onWithContactsClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          onClick={onWithContactsClick}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>A Suivre = {withContacts}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-success rounded-full h-2" style={{ width: '100%' }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
