import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

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
        <div className="space-y-3">
          {data.slice(0, 5).map((item) => (
            <div key={item.department} className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.department}</span>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
