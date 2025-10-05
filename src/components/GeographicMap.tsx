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
        </div>
      </CardContent>
    </Card>
  );
}
