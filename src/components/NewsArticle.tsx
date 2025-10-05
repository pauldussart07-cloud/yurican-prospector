import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NewsArticleProps {
  title: string;
  sector: string;
  summary: string;
  link: string;
  source: string;
}

export function NewsArticle({ title, sector, summary, link, source }: NewsArticleProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold line-clamp-2">{title}</CardTitle>
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="shrink-0 text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <Badge variant="secondary" className="w-fit text-xs mt-2">{sector}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-3">{summary}</p>
        <p className="text-xs font-medium text-primary">{source}</p>
      </CardContent>
    </Card>
  );
}
