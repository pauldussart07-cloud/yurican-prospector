import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Calendar, Users, Building2, GripVertical } from 'lucide-react';
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
  
  // Déterminer le statut actuel (le plus avancé)
  const currentStatus = contacts.length > 0 ? (contacts[0] as any).status || 'Nouveau' : 'Nouveau';
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${companyId}|${currentStatus}`,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

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
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`mb-2 hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <CardContent className="p-2">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
                {...listeners} 
                {...attributes}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between cursor-pointer group gap-2 flex-1 text-left bg-transparent border-none p-0 w-full">
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
                </button>
              </CollapsibleTrigger>
            </div>

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
