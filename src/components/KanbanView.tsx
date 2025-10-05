import { useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { Lead, Contact } from '@/lib/mockData';

type ContactStatus = 'Nouveau' | 'Engagé' | 'Discussion' | 'RDV' | 'Exclu';

const STATUS_HIERARCHY: ContactStatus[] = ['Nouveau', 'Engagé', 'Discussion', 'RDV', 'Exclu'];

interface KanbanViewProps {
  leads: Array<{ lead: Lead; company: any }>;
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
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

export const KanbanView = ({ leads, contacts, onContactClick, searchQuery = '' }: KanbanViewProps) => {
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
      const companyContacts = contacts.filter(c => c.companyId === lead.companyId);
      
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
        companyId: lead.companyId,
        companyName: company.name,
        contacts: companyContacts,
      });
    });

    return grouped;
  }, [leads, contacts, searchQuery]);

  return (
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
  );
};
