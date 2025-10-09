import { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { Lead, Contact } from '@/lib/mockData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ContactStatus = 'Nouveau' | 'Engagé' | 'Discussion' | 'RDV' | 'Exclu';

const STATUS_HIERARCHY: ContactStatus[] = ['Nouveau', 'Engagé', 'Discussion', 'RDV', 'Exclu'];

interface KanbanViewProps {
  leads: Array<{ lead: Lead; company: any }>;
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
  onContactStatusChange: (contactId: string, newStatus: ContactStatus) => void;
  searchQuery?: string;
}

// Fonction pour obtenir le statut le plus avancé
const getMostAdvancedStatus = (statuses: ContactStatus[]): ContactStatus => {
  if (statuses.length === 0) return 'Nouveau';
  
  let maxIndex = 0;
  statuses.forEach(status => {
    const index = STATUS_HIERARCHY.indexOf(status);
    if (index > maxIndex) maxIndex = index;
  });
  
  return STATUS_HIERARCHY[maxIndex];
};

export const KanbanView = ({ leads, contacts, onContactClick, onContactStatusChange, searchQuery = '' }: KanbanViewProps) => {
  const [draggedCompany, setDraggedCompany] = useState<{
    companyId: string;
    companyName: string;
    contacts: Contact[];
  } | null>(null);
  const [showContactSelector, setShowContactSelector] = useState(false);

  // Handler pour mettre à jour le statut et le state local
  const handleStatusChangeInDialog = (contactId: string, newStatus: ContactStatus) => {
    // Mettre à jour via le prop
    onContactStatusChange(contactId, newStatus);
    
    // Mettre à jour draggedCompany pour refléter le changement immédiatement dans le popup
    if (draggedCompany) {
      setDraggedCompany({
        ...draggedCompany,
        contacts: draggedCompany.contacts.map(contact =>
          contact.id === contactId
            ? { ...contact, status: newStatus } as Contact
            : contact
        ),
      });
    }
  };
  // Grouper les entreprises par statut
  const companiesByStatus = useMemo(() => {
    const grouped: Record<ContactStatus, Array<{
      companyId: string;
      companyName: string;
      contacts: Contact[];
    }>> = {
      'Nouveau': [],
      'Engagé': [],
      'Discussion': [],
      'RDV': [],
      'Exclu': [],
    };

    leads.forEach(({ lead, company }) => {
      if (!company) return;

      // Récupérer les contacts de cette entreprise
      const companyContacts = contacts.filter(c => c.companyId === lead.id);
      
      // Si pas de contacts, ne pas afficher l'entreprise
      if (companyContacts.length === 0) return;

      // Filtrer par recherche si nécessaire
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCompany = company.name.toLowerCase().includes(query);
        const matchesContact = companyContacts.some(contact => {
          const fullName = contact.fullName.toLowerCase();
          return fullName.includes(query);
        });

        if (!matchesCompany && !matchesContact) return;
      }

      // Déterminer le statut de l'entreprise (le plus avancé parmi ses contacts)
      const statuses = companyContacts.map(c => (c as any).status || 'Nouveau' as ContactStatus);
      const companyStatus = getMostAdvancedStatus(statuses);

      grouped[companyStatus].push({
        companyId: lead.id,
        companyName: company.name,
        contacts: companyContacts,
      });
    });

    return grouped;
  }, [leads, contacts, searchQuery]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const [companyId, sourceStatus] = (active.id as string).split('|');
    
    const company = companiesByStatus[sourceStatus as ContactStatus].find(
      c => c.companyId === companyId
    );
    
    if (company) {
      setDraggedCompany(company);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedCompany) {
      setDraggedCompany(null);
      return;
    }

    const targetStatus = over.id as ContactStatus;
    const [companyId, sourceStatus] = (active.id as string).split('|');

    // Si le statut est différent, ouvrir le dialog
    if (sourceStatus !== targetStatus) {
      setShowContactSelector(true);
      // Ne pas effacer draggedCompany ici, on le fera à la fermeture du dialog
    } else {
      setDraggedCompany(null);
    }
  };

  const handleCloseDialog = () => {
    setShowContactSelector(false);
    setDraggedCompany(null);
  };

  return (
    <>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {STATUS_HIERARCHY.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                companies={companiesByStatus[status]}
                onContactClick={onContactClick}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {draggedCompany && (
            <div className="bg-card border rounded-lg p-3 shadow-lg opacity-90">
              <div className="font-semibold text-sm">{draggedCompany.companyName}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {draggedCompany.contacts.length} contact{draggedCompany.contacts.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Dialog open={showContactSelector} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le statut des contacts</DialogTitle>
            <DialogDescription>
              Sélectionnez le nouveau statut pour chaque contact de {draggedCompany?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {draggedCompany?.contacts.map(contact => (
              <Card key={contact.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-1">{contact.fullName}</div>
                    <div className="text-xs text-muted-foreground">{contact.role}</div>
                  </div>
                  
                  <div className="flex-shrink-0 w-48">
                    <Label htmlFor={`status-${contact.id}`} className="text-xs mb-1 block">
                      Statut
                    </Label>
                    <Select
                      value={(contact as any).status || 'Nouveau'}
                      onValueChange={(value) => {
                        handleStatusChangeInDialog(contact.id, value as ContactStatus);
                      }}
                    >
                      <SelectTrigger id={`status-${contact.id}`} className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nouveau">Nouveau</SelectItem>
                        <SelectItem value="Engagé">Engagé</SelectItem>
                        <SelectItem value="Discussion">Discussion</SelectItem>
                        <SelectItem value="RDV">RDV planifié</SelectItem>
                        <SelectItem value="Exclu">Exclu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={handleCloseDialog}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
