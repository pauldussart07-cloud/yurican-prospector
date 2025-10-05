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
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 500 550" className="w-full h-[250px]">
            {/* Carte simplifiée de France avec régions */}
            
            {/* Bretagne */}
            <path d="M 30,180 L 10,200 L 30,220 L 60,230 L 90,210 L 80,180 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Bretagne</title>
            </path>
            
            {/* Normandie */}
            <path d="M 90,150 L 70,170 L 90,210 L 140,200 L 160,160 L 130,140 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Normandie</title>
            </path>
            
            {/* Hauts-de-France */}
            <path d="M 160,100 L 140,130 L 160,160 L 200,170 L 240,150 L 250,110 L 210,90 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Hauts-de-France</title>
            </path>
            
            {/* Île-de-France */}
            <path d="M 180,190 L 170,210 L 190,230 L 220,220 L 230,200 L 210,180 Z" 
              fill="hsl(var(--primary))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>Île-de-France</title>
            </path>
            
            {/* Grand Est */}
            <path d="M 250,150 L 240,180 L 250,230 L 300,240 L 340,220 L 350,180 L 320,140 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Grand Est</title>
            </path>
            
            {/* Pays de la Loire */}
            <path d="M 90,230 L 80,260 L 100,290 L 140,280 L 150,250 L 130,230 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Pays de la Loire</title>
            </path>
            
            {/* Centre-Val de Loire */}
            <path d="M 150,230 L 140,260 L 160,290 L 210,290 L 230,260 L 220,230 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Centre-Val de Loire</title>
            </path>
            
            {/* Bourgogne-Franche-Comté */}
            <path d="M 250,240 L 240,270 L 260,310 L 310,320 L 340,290 L 340,250 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Bourgogne-Franche-Comté</title>
            </path>
            
            {/* Nouvelle-Aquitaine */}
            <path d="M 100,290 L 80,340 L 90,410 L 140,430 L 200,410 L 210,360 L 180,320 L 140,310 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Nouvelle-Aquitaine</title>
            </path>
            
            {/* Auvergne-Rhône-Alpes */}
            <path d="M 210,330 L 200,370 L 220,430 L 280,450 L 330,420 L 340,360 L 310,320 L 260,310 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Auvergne-Rhône-Alpes</title>
            </path>
            
            {/* Occitanie */}
            <path d="M 140,430 L 130,480 L 160,520 L 220,520 L 280,500 L 280,450 L 220,430 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Occitanie</title>
            </path>
            
            {/* PACA */}
            <path d="M 280,450 L 270,490 L 300,520 L 360,510 L 390,470 L 370,430 L 330,420 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Provence-Alpes-Côte d'Azur</title>
            </path>
            
            {/* Corse */}
            <path d="M 420,490 L 415,520 L 435,540 L 455,530 L 460,500 L 440,480 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
              className="hover:fill-primary/20 transition-colors cursor-pointer"
            >
              <title>Corse</title>
            </path>
          </svg>
        </div>
        
        {/* Légende */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Top départements</p>
          {data.slice(0, 3).map((item) => (
            <div key={item.department} className="flex items-center justify-between text-xs">
              <span className="font-medium">{item.department}</span>
              <span className="text-muted-foreground">{item.count} prospects</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
