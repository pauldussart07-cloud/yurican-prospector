import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import franceMap from '@/assets/france-map.png';

interface GeographicMapProps {
  data: {
    department: string;
    count: number;
  }[];
}

export function GeographicMap({ data }: GeographicMapProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Répartition géographique</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <img 
            src={franceMap} 
            alt="Carte de France" 
            className="w-full h-[280px] object-contain"
          />
          
          {/* Overlay avec les données */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg pointer-events-auto">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Top régions</p>
              <div className="space-y-1.5">
                {data.slice(0, 5).map((item, index) => (
                  <div key={item.department} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full bg-primary"
                      style={{ opacity: 1 - (index * 0.15) }}
                    />
                    <span className="font-medium min-w-[80px]">{item.department}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
