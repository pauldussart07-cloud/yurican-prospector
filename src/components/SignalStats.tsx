import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Target } from 'lucide-react';

interface SignalStatsProps {
  undiscovered: number;
  discoveredNoContacts: number;
  withContacts: number;
}

export function SignalStats({ undiscovered, discoveredNoContacts, withContacts }: SignalStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Leads chauds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Nouveau = {undiscovered}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-warning rounded-full h-2" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>A traiter = {discoveredNoContacts}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-secondary rounded-full h-2" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="space-y-2">
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
