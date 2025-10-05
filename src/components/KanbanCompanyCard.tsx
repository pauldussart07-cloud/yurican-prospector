import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Calendar, Users, Building2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Contact } from '@/lib/mockData';

type ContactStatus = 'Nouveau' | 'Engagé' | 'Discussion' | 'RDV' | 'Exclu';

interface KanbanCompanyCardProps {
  companyName: string;
  companyId: string;
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
}

export const KanbanCompanyCard = ({ companyName, companyId, contacts, onContactClick }: KanbanCompanyCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Trouver la date de suivi la plus proche
  const getNextFollowUpDate = () => {
    const dates = contacts
      .map(c => (c as any).followUpDate)
      .filter(Boolean)
      .sort();
    return dates[0] || null;
  };

  const nextFollowUp = getNextFollowUpDate();

  return (
    <Card className="mb-2 hover:shadow-md transition-shadow">
      <CardContent className="p-2">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="space-y-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer group gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                  <Building2 className="h-3 w-3 text-primary flex-shrink-0" />
                  <h4 className="font-semibold text-xs group-hover:text-primary transition-colors truncate">
                    {companyName}
                  </h4>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{contacts.length}</span>
                  </div>
                  
                  {nextFollowUp && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(nextFollowUp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="space-y-1 ml-5 pt-1 border-t">
                {contacts.map(contact => (
                  <Button
                    key={contact.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-1 px-2 hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      onContactClick(contact);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="font-medium text-xs truncate flex-1">{contact.fullName}</div>
                        <Badge 
                          variant={(contact as any).status === 'Exclu' ? 'destructive' : 'secondary'} 
                          className="text-[9px] px-1 py-0 h-4"
                        >
                          {(contact as any).status || 'Nouveau'}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{contact.role}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
