import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KanbanCompanyCard } from './KanbanCompanyCard';
import { Contact } from '@/lib/mockData';

type ContactStatus = 'Nouveau' | 'Engagé' | 'Discussion' | 'RDV' | 'Exclu';

interface KanbanColumnProps {
  status: ContactStatus;
  companies: Array<{
    companyId: string;
    companyName: string;
    contacts: Contact[];
  }>;
  onContactClick: (contact: Contact) => void;
}

const getStatusLabel = (status: ContactStatus): string => {
  switch (status) {
    case 'Nouveau':
      return 'Nouveau';
    case 'Engagé':
      return 'Engagé';
    case 'Discussion':
      return 'Discussion';
    case 'RDV':
      return 'RDV planifié';
    case 'Exclu':
      return 'Exclu';
    default:
      return status;
  }
};

const getStatusColor = (status: ContactStatus): string => {
  switch (status) {
    case 'Nouveau':
      return 'bg-muted';
    case 'Engagé':
      return 'bg-secondary';
    case 'Discussion':
      return 'bg-primary/20';
    case 'RDV':
      return 'bg-accent';
    case 'Exclu':
      return 'bg-destructive/20';
    default:
      return 'bg-muted';
  }
};

export const KanbanColumn = ({ status, companies, onContactClick }: KanbanColumnProps) => {
  const totalContacts = companies.reduce((sum, company) => sum + company.contacts.length, 0);
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-shrink-0 w-52 transition-colors rounded-lg p-2 ${
        isOver ? 'bg-accent/50' : ''
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-xs uppercase tracking-wide">
          {getStatusLabel(status)}
        </h3>
        <Badge variant="outline" className={`${getStatusColor(status)} border-0 text-xs`}>
          {companies.length}
        </Badge>
      </div>
      
      <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
        {companies.length === 0 ? (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground text-center">
              Aucune entreprise
            </p>
          </Card>
        ) : (
          companies.slice(0, 50).map(company => (
            <KanbanCompanyCard
              key={company.companyId}
              companyName={company.companyName}
              companyId={company.companyId}
              contacts={company.contacts}
              onContactClick={onContactClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
