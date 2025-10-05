import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatusHistogramProps {
  data: {
    status: string;
    count: number;
  }[];
  onStatusClick?: (status: string) => void;
}

export function StatusHistogram({ data, onStatusClick }: StatusHistogramProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Statuts</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="status" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={12}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
              cursor={onStatusClick ? 'pointer' : 'default'}
              onClick={(data) => {
                if (onStatusClick && data?.status) {
                  onStatusClick(data.status);
                }
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
