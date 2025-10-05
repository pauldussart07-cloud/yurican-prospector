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
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="space-y-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-start justify-between cursor-pointer group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                      {companyName}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground ml-6">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{contacts.length} contact{contacts.length > 1 ? 's' : ''}</span>
                    </div>
                    
                    {nextFollowUp && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(nextFollowUp).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="space-y-2 ml-6 pt-2 border-t">
                {contacts.map(contact => (
                  <Button
                    key={contact.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-accent"
                    onClick={() => onContactClick(contact)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{contact.fullName}</div>
                      <div className="text-xs text-muted-foreground truncate">{contact.role}</div>
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
