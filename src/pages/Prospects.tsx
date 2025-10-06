import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, Mail, Users as UsersIcon, Building2, MapPin, Briefcase, ExternalLink, Linkedin, TrendingUp, Users, ArrowUp, ArrowDown, ChevronDown, ChevronUp, ChevronRight, Globe, ThumbsUp, ThumbsDown, Calendar, UserCircle2, Target, Medal, Search, List, Kanban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { mockLeads, mockCompanies, mockContacts, Lead, Contact } from '@/lib/mockData';
import { contactsService, PersonaType } from '@/services/contactsService';
import { supabase } from '@/integrations/supabase/client';
import { KanbanView } from '@/components/KanbanView';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useActions } from '@/contexts/ActionsContext';

// Types et hiérarchie des statuts
type ContactStatus = 'Nouveau' | 'Engagé' | 'Discussion' | 'RDV' | 'Exclu';

const STATUS_HIERARCHY: ContactStatus[] = ['Nouveau', 'Engagé', 'Discussion', 'RDV', 'Exclu'];

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

// Fonction pour obtenir la couleur du badge selon le statut
const getStatusBadgeVariant = (status: ContactStatus): "default" | "secondary" | "outline" => {
  switch (status) {
    case 'Nouveau':
      return 'outline';
    case 'Engagé':
      return 'secondary';
    case 'Discussion':
      return 'default';
    case 'RDV':
      return 'default';
    case 'Exclu':
      return 'destructive' as any;
    default:
      return 'outline';
  }
};
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Prospects = () => {
  const { toast } = useToast();
  const { getActionName } = useActions();
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [generatingContacts, setGeneratingContacts] = useState(false);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [contactNote, setContactNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [discoveredContacts, setDiscoveredContacts] = useState<Set<string>>(new Set());
  const [showDiscoverDialog, setShowDiscoverDialog] = useState(false);
  const [contactToDiscover, setContactToDiscover] = useState<{ id: string; type: 'phone' | 'email' } | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(true);
  
  // Persona selector state
  const [totalContactsToGenerate, setTotalContactsToGenerate] = useState(3);
  const [userPersonas, setUserPersonas] = useState<any[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);

  // Pagination et filtres
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'ciblage' | 'signal'>('ciblage');
  const [sortCriteria, setSortCriteria] = useState<'name' | 'sector' | 'revenue' | 'headcount' | 'department' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'list' | 'kanban'>('list');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [expandedContactsLeads, setExpandedContactsLeads] = useState<Set<string>>(new Set());

  // Appliquer les filtres depuis l'URL
  useEffect(() => {
    const view = searchParams.get('view');
    const status = searchParams.get('status');
    
    if (view === 'signal') {
      setViewMode('signal');
    }
    
    if (status) {
      setStatusFilter(status as ContactStatus);
    }
  }, [searchParams]);

  // Charger les leads depuis Supabase
  useEffect(() => {
    const loadLeads = async () => {
      setLoadingLeads(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingLeads(false);
        return;
      }

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.error('Error loading leads:', leadsError);
        setLoadingLeads(false);
        return;
      }

      // Charger les contacts associés
      const { data: contactsData, error: contactsError } = await supabase
        .from('lead_contacts')
        .select('*')
        .eq('user_id', user.id);

      if (contactsError) {
        console.error('Error loading contacts:', contactsError);
      }

      // Transformer les leads pour correspondre au format attendu
      const transformedLeads = (leadsData || []).map(lead => ({
        id: lead.id,
        companyId: lead.company_id,
        status: lead.status,
        contactsCount: (contactsData || []).filter(c => c.lead_id === lead.id).length,
        createdAt: new Date(lead.created_at),
        updatedAt: new Date(lead.updated_at),
        isHotSignal: lead.is_hot_signal,
        signalSummary: lead.signal_summary,
      }));

      // Transformer les contacts
      const transformedContacts = (contactsData || []).map(contact => ({
        id: contact.id,
        companyId: contact.lead_id,
        fullName: contact.full_name,
        role: contact.role,
        email: contact.email || '',
        phone: contact.phone || '',
        linkedin: contact.linkedin || '',
        status: contact.status as ContactStatus,
        note: contact.note || '',
        followUpDate: contact.follow_up_date || '',
        personaPosition: contact.persona_position || null,
        seniority: 'Senior',
        domain: 'General',
        source: 'Manual',
        createdAt: new Date(contact.created_at),
      }));

      // Charger l'état découvert des contacts
      const discovered = new Set<string>();
      (contactsData || []).forEach(contact => {
        if (contact.is_email_discovered) {
          discovered.add(`${contact.id}-email`);
        }
        if (contact.is_phone_discovered) {
          discovered.add(`${contact.id}-phone`);
        }
      });
      setDiscoveredContacts(discovered);

      setLeads(transformedLeads);
      setContacts(transformedContacts);
      setLoadingLeads(false);
    };

    loadLeads();
  }, []);


  const handleGenerateContacts = async () => {
    if (!selectedLead || userPersonas.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Vous devez créer au moins un ciblage de contacts.',
        variant: 'destructive',
      });
      return;
    }

    if (totalContactsToGenerate < 1) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un nombre de contacts valide.',
        variant: 'destructive',
      });
      return;
    }

    const lead = leads.find(l => l.id === selectedLead);
    const company = mockCompanies.find(c => c.id === lead?.companyId);
    
    if (!company) return;

    setGeneratingContacts(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Utiliser tous les personas dans l'ordre hiérarchique (position)
      // Distribuer les contacts de manière équilibrée entre les personas
      const contactsPerPersona = Math.ceil(totalContactsToGenerate / userPersonas.length);
      let allNewContacts: any[] = [];
      let remainingContacts = totalContactsToGenerate;
      
      for (let i = 0; i < userPersonas.length && remainingContacts > 0; i++) {
        const persona = userPersonas[i];
        const count = Math.min(contactsPerPersona, remainingContacts);
        
        const contacts = await contactsService.generateContacts({
          companyId: company.id,
          companyName: company.name,
          personas: [persona],
          count: count,
        });
        
        // Ajouter la position du persona (1-based index)
        const contactsWithPosition = contacts.map(contact => ({
          ...contact,
          personaPosition: (persona as any).position || (i + 1),
        }));
        
        allNewContacts = [...allNewContacts, ...contactsWithPosition];
        remainingContacts -= count;
      }
      
      const newContacts = allNewContacts;

      // Sauvegarder les contacts dans Supabase
      const contactsToInsert = newContacts.map(contact => ({
        user_id: user.id,
        lead_id: selectedLead,
        full_name: contact.fullName,
        role: contact.role,
        email: contact.email || null,
        phone: contact.phone || null,
        linkedin: (contact as any).linkedin || null,
        status: (contact as any).status || 'Nouveau',
        note: (contact as any).note || null,
        follow_up_date: (contact as any).followUpDate || null,
        is_email_discovered: false,
        is_phone_discovered: false,
        persona_position: (contact as any).personaPosition || null,
      }));

      const { data: insertedContacts, error } = await supabase
        .from('lead_contacts')
        .insert(contactsToInsert)
        .select();

      if (error) {
        console.error('Error saving contacts:', error);
        throw error;
      }

      // Mettre à jour l'état local avec les contacts insérés
      const transformedContacts = (insertedContacts || []).map(contact => ({
        id: contact.id,
        companyId: contact.lead_id,
        fullName: contact.full_name,
        role: contact.role,
        email: contact.email || '',
        phone: contact.phone || '',
        linkedin: contact.linkedin || '',
        status: contact.status as ContactStatus,
        note: contact.note || '',
        followUpDate: contact.follow_up_date || '',
        personaPosition: contact.persona_position || null,
        seniority: 'Senior',
        domain: 'General',
        source: 'Manual',
        createdAt: new Date(contact.created_at),
      }));

      setContacts([...contacts, ...transformedContacts]);
      
      toast({
        title: 'Contacts trouvés',
        description: `${transformedContacts.length} contact${transformedContacts.length > 1 ? 's ont' : ' a'} été ajouté${transformedContacts.length > 1 ? 's' : ''}.`,
      });

      setShowPersonaDialog(false);
      setTotalContactsToGenerate(3);
    } catch (error) {
      console.error('Error generating contacts:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la recherche des contacts.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingContacts(false);
    }
  };

  const personas: PersonaType[] = [
    'Décisionnaire Commercial',
    'Décisionnaire Marketing',
    'Direction Générale',
    'Opérations',
  ];

  // Charger les personas de l'utilisateur depuis Supabase
  useEffect(() => {
    const loadUserPersonas = async () => {
      setLoadingPersonas(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingPersonas(false);
        return;
      }

      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (!error && data) {
        setUserPersonas(data);
      }
      setLoadingPersonas(false);
    };

    if (showPersonaDialog) {
      loadUserPersonas();
    }
  }, [showPersonaDialog]);

  // Déterminer la taille de l'icône CA
  const getRevenueIcon = (ca: number) => {
    if (ca >= 50000000) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (ca >= 10000000) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  // Déterminer la taille de l'icône effectif
  const getHeadcountIcon = (headcount: number) => {
    if (headcount >= 250) return <Users className="h-5 w-5 text-blue-600" />;
    if (headcount >= 50) return <Users className="h-4 w-4 text-blue-500" />;
    return <Users className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  // Calculer le statut du lead basé sur ses contacts
  const getLeadStatus = (leadId: string): ContactStatus => {
    const leadContacts = contacts.filter(c => c.companyId === leadId);
    if (leadContacts.length === 0) return 'Nouveau';
    
    const statuses = leadContacts.map(c => (c as any).status || 'Nouveau' as ContactStatus);
    return getMostAdvancedStatus(statuses);
  };

  // Fonction pour trier les contacts par statut et hiérarchie
  const sortContactsByStatusAndHierarchy = (contactsList: Contact[]) => {
    return [...contactsList].sort((a, b) => {
      // D'abord par statut (le plus avancé en premier)
      const statusA = (a as any).status || 'Nouveau';
      const statusB = (b as any).status || 'Nouveau';
      const statusIndexA = STATUS_HIERARCHY.indexOf(statusA);
      const statusIndexB = STATUS_HIERARCHY.indexOf(statusB);
      
      if (statusIndexA !== statusIndexB) {
        return statusIndexB - statusIndexA; // Ordre décroissant (plus avancé d'abord)
      }
      
      // Ensuite par ordre alphabétique du nom
      return a.fullName.localeCompare(b.fullName);
    });
  };

  const toggleExpandContacts = (leadId: string) => {
    const newExpanded = new Set(expandedContactsLeads);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    setExpandedContactsLeads(newExpanded);
  };

  // Filtrer et trier les leads
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads;

    // Filtrer par mode (signal = leads chauds uniquement)
    if (viewMode === 'signal') {
      filtered = filtered.filter(lead => lead.isHotSignal);
    }

    const leadsWithCompanies = filtered
      .map(lead => {
        // Récupérer l'entreprise complète depuis mockCompanies ou utiliser un objet par défaut
        const company = mockCompanies.find(c => c.id === lead.companyId) || {
          id: lead.companyId,
          name: 'Entreprise inconnue',
          sector: '',
          department: '',
          ca: 0,
          headcount: 0,
          website: '',
          linkedin: '',
          address: '',
          siret: '',
          naf: '',
          revenue: 0,
          isHidden: false,
        };
        return { lead, company };
      });

    // Rechercher dans l'URL les filtres additionnels
    const noContactsFilter = searchParams.get('noContacts') === 'true';
    const hasContactsFilter = searchParams.get('hasContacts') === 'true';

    // Filtrer par contacts
    let contactsFiltered = leadsWithCompanies;
    if (noContactsFilter) {
      contactsFiltered = leadsWithCompanies.filter(({ lead }) => {
        const leadContacts = contacts.filter(c => c.companyId === lead.id);
        return leadContacts.length === 0;
      });
    } else if (hasContactsFilter) {
      contactsFiltered = leadsWithCompanies.filter(({ lead }) => {
        const leadContacts = contacts.filter(c => c.companyId === lead.id);
        return leadContacts.length > 0;
      });
    }

    // Filtrer par recherche sémantique
    let searchFiltered = contactsFiltered;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      searchFiltered = contactsFiltered.filter(({ lead, company }) => {
        // Recherche dans le nom de l'entreprise
        if (company?.name.toLowerCase().includes(query)) return true;
        
        // Recherche dans les contacts associés
        const leadContacts = contacts.filter(c => c.companyId === lead.id);
        return leadContacts.some(contact => {
          const fullName = contact.fullName.toLowerCase();
          const [firstName, ...lastNameParts] = fullName.split(' ');
          const lastName = lastNameParts.join(' ');
          
          return fullName.includes(query) || 
                 firstName.includes(query) || 
                 lastName.includes(query);
        });
      });
    }

    // Filtrer par statut
    let statusFiltered = searchFiltered;
    if (statusFilter !== 'all') {
      statusFiltered = searchFiltered.filter(({ lead }) => {
        return getLeadStatus(lead.id) === statusFilter;
      });
    }

    return statusFiltered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortCriteria) {
        case 'name':
          comparison = (a.company?.name || '').localeCompare(b.company?.name || '');
          break;
        case 'sector':
          comparison = (a.company?.sector || '').localeCompare(b.company?.sector || '');
          break;
        case 'revenue':
          comparison = (a.company?.ca || 0) - (b.company?.ca || 0);
          break;
        case 'headcount':
          comparison = (a.company?.headcount || 0) - (b.company?.headcount || 0);
          break;
        case 'department':
          comparison = (a.company?.department || '').localeCompare(b.company?.department || '');
          break;
        case 'status':
          comparison = a.lead.status.localeCompare(b.lead.status);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [leads, viewMode, sortCriteria, sortDirection, searchQuery, contacts, statusFilter, searchParams]);

  // Déplier automatiquement les leads lors de la recherche
  useEffect(() => {
    if (searchQuery.trim()) {
      // Déplier tous les leads filtrés qui ont des contacts
      const leadsToExpand = new Set(
        filteredAndSortedLeads
          .filter(({ lead }) => {
            const leadContacts = contacts.filter(c => c.companyId === lead.id);
            return leadContacts.length > 0;
          })
          .map(({ lead }) => lead.id)
      );
      setExpandedLeads(leadsToExpand);
    } else {
      // Replier tout quand la recherche est vide
      setExpandedLeads(new Set());
    }
  }, [searchQuery, filteredAndSortedLeads, contacts]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredAndSortedLeads.slice(startIndex, endIndex);

  const handleSelectAll = () => {
    if (selectedLeads.size === paginatedLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(paginatedLeads.map(item => item.lead.id)));
    }
  };

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const toggleLeadExpanded = (leadId: string) => {
    const newExpanded = new Set(expandedLeads);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    setExpandedLeads(newExpanded);
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setContactNote((contact as any).note || '');
    setFollowUpDate((contact as any).followUpDate || '');
    setShowContactDialog(true);
  };

  const handleStatusChange = async (contactId: string, newStatus: ContactStatus) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Mise à jour dans Supabase
    const { error } = await supabase
      .from('lead_contacts')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating contact status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
        variant: 'destructive',
      });
      return;
    }

    // Mise à jour de l'état local
    setContacts(contacts.map(c => 
      c.id === contactId ? { ...c, status: newStatus } : c
    ));

    // Mise à jour du contact sélectionné si c'est celui qu'on modifie
    if (selectedContact?.id === contactId) {
      setSelectedContact({ ...selectedContact, status: newStatus });
    }

    toast({
      title: 'Statut mis à jour',
      description: 'Le statut a été enregistré avec succès.',
    });
  };

  const handleSaveContact = async () => {
    if (!selectedContact) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Mise à jour dans Supabase
    const { error } = await supabase
      .from('lead_contacts')
      .update({ 
        note: contactNote, 
        follow_up_date: followUpDate || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedContact.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer les modifications.',
        variant: 'destructive',
      });
      return;
    }

    // Mise à jour de l'état local
    const updatedContacts = contacts.map(contact => 
      contact.id === selectedContact.id 
        ? { ...contact, note: contactNote, followUpDate }
        : contact
    );
    
    setContacts(updatedContacts);
    
    toast({
      title: 'Modifications enregistrées',
      description: 'Les modifications ont été enregistrées avec succès.',
    });
    
    setShowContactDialog(false);
  };

  const handleDiscoverRequest = (contactId: string, type: 'phone' | 'email') => {
    setContactToDiscover({ id: contactId, type });
    setShowDiscoverDialog(true);
  };

  const handleConfirmDiscover = async () => {
    if (!contactToDiscover) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Déterminer quel champ mettre à jour
    const updateField = contactToDiscover.type === 'email' 
      ? { is_email_discovered: true }
      : { is_phone_discovered: true };

    // Mise à jour dans Supabase
    const { error } = await supabase
      .from('lead_contacts')
      .update({ 
        ...updateField,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactToDiscover.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating contact discovery:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la découverte.',
        variant: 'destructive',
      });
      return;
    }

    const key = `${contactToDiscover.id}-${contactToDiscover.type}`;
    setDiscoveredContacts(new Set([...discoveredContacts, key]));
    
    toast({
      title: 'Contact découvert',
      description: `8 crédits ont été débités de votre compte.`,
    });
    
    setShowDiscoverDialog(false);
    setContactToDiscover(null);
  };

  const isContactInfoDiscovered = (contactId: string, type: 'phone' | 'email') => {
    return discoveredContacts.has(`${contactId}-${type}`);
  };

  // Fonction pour surligner le texte correspondant à la recherche
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-primary/20 text-primary font-semibold rounded px-1 transition-colors">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(40 25% 95%)' }}>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Prospects</h1>
          <ToggleGroup type="single" value={displayMode} onValueChange={(value) => value && setDisplayMode(value as 'list' | 'kanban')}>
            <ToggleGroupItem value="list" aria-label="Vue liste">
              <List className="h-4 w-4 mr-2" />
              Liste
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Vue kanban">
              <Kanban className="h-4 w-4 mr-2" />
              Kanban
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Badge variant="outline" className="text-sm bg-card border-border flex items-center">
          {filteredAndSortedLeads.length} lead{filteredAndSortedLeads.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {displayMode === 'kanban' ? (
        <div className="space-y-4">
          {/* Header pour la vue Kanban */}
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="view-mode-kanban" className="text-sm font-medium">
                  Ciblage
                </Label>
                <Switch
                  id="view-mode-kanban"
                  checked={viewMode === 'signal'}
                  onCheckedChange={(checked) => setViewMode(checked ? 'signal' : 'ciblage')}
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="view-mode-kanban" className="text-sm font-medium">
                    Signal
                  </Label>
                  {leads.filter(l => l.isHotSignal).length > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center px-1.5">
                      {leads.filter(l => l.isHotSignal).length}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 border-l pl-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher une entreprise ou un contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-80"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vue Kanban */}
          <KanbanView
            leads={filteredAndSortedLeads}
            contacts={contacts}
            onContactClick={handleContactClick}
            searchQuery={searchQuery}
          />
        </div>
      ) : (
        <>
          {/* Liste des leads */}
          <div className="space-y-3">
            {/* Header avec checkbox select all et actions */}
            <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedLeads.size === paginatedLeads.length && paginatedLeads.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Tout sélectionner
              </span>
            </div>
            
            <div className="flex items-center gap-3 border-l pl-4">
              <Label htmlFor="view-mode-leads" className="text-sm font-medium">
                Ciblage
              </Label>
              <Switch
                id="view-mode-leads"
                checked={viewMode === 'signal'}
                onCheckedChange={(checked) => setViewMode(checked ? 'signal' : 'ciblage')}
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="view-mode-leads" className="text-sm font-medium">
                  Signal
                </Label>
                {leads.filter(l => l.isHotSignal).length > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center px-1.5">
                    {leads.filter(l => l.isHotSignal).length}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 border-l pl-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher une entreprise ou un contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedLeads.size > 0 ? (
              <>
                <span className="font-medium text-sm">
                  {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''} sélectionné{selectedLeads.size > 1 ? 's' : ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLeads(new Set())}
                >
                  Annuler
                </Button>
              </>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Trier par {sortCriteria === 'name' && 'Nom'}
                      {sortCriteria === 'sector' && 'Secteur'}
                      {sortCriteria === 'revenue' && 'CA'}
                      {sortCriteria === 'headcount' && 'Effectif'}
                      {sortCriteria === 'department' && 'Département'}
                      {sortCriteria === 'status' && 'Statut'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background">
                    <DropdownMenuItem onClick={() => setSortCriteria('name')}>
                      Nom de l'entreprise
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('sector')}>
                      Secteur d'activité
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('revenue')}>
                      Chiffre d'affaires
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('headcount')}>
                      Effectif
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('department')}>
                      Département
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('status')}>
                      Statut
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Statut: {statusFilter === 'all' ? 'Tous' : statusFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background">
                    <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                      Tous
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('Nouveau')}>
                      Nouveau
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('Engagé')}>
                      Engagé
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('Discussion')}>
                      Discussion
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('RDV')}>
                      RDV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('Exclu')}>
                      Exclu
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {paginatedLeads.map(({ lead, company }) => {
          const leadContacts = contacts.filter(c => c.companyId === lead.id);
          const isExpanded = expandedLeads.has(lead.id);

          if (!company) return null;

          // En mode signal, affichage différent
          if (viewMode === 'signal') {
            const sortedContacts = sortContactsByStatusAndHierarchy(leadContacts);
            const isContactsExpanded = expandedContactsLeads.has(lead.id);
            const displayedContacts = isContactsExpanded ? sortedContacts : sortedContacts.slice(0, 3);
            const remainingCount = sortedContacts.length - 3;

            return (
              <Card key={lead.id} className="hover:shadow-md transition-all duration-200 hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeads.has(lead.id)}
                        onCheckedChange={() => handleSelectLead(lead.id)}
                      />
                    </div>

                    {/* Bloc 4 : Liste des contacts */}
                    <div className="w-64 space-y-2">
                      {leadContacts.length > 0 ? (
                        displayedContacts.map((contact, index) => (
                          <div
                            key={contact.id}
                            className="flex items-center gap-2 p-2 rounded border bg-card hover:bg-card/80 cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactClick(contact);
                            }}
                          >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                            {(contact as any).personaPosition || index + 1}
                          </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">{contact.fullName}</p>
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <Mail className="h-3 w-3 text-primary flex-shrink-0 ml-2 cursor-pointer" />
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-auto">
                                    <p className="text-xs">{contact.email}</p>
                                  </HoverCardContent>
                                </HoverCard>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                                {isContactInfoDiscovered(contact.id, 'phone') ? (
                                  <HoverCard>
                                    <HoverCardTrigger asChild>
                                      <Phone className="h-3 w-3 text-primary flex-shrink-0 ml-2 cursor-pointer" />
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-auto">
                                      <p className="text-xs">{contact.phone}</p>
                                    </HoverCardContent>
                                  </HoverCard>
                                ) : (
                                  <HoverCard>
                                    <HoverCardTrigger asChild>
                                      <Phone 
                                        className="h-3 w-3 text-muted-foreground/30 flex-shrink-0 ml-2 cursor-pointer" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDiscoverRequest(contact.id, 'phone');
                                        }}
                                      />
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-auto">
                                      <p className="text-xs blur-sm select-none">{contact.phone}</p>
                                    </HoverCardContent>
                                  </HoverCard>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead.id);
                            setShowPersonaDialog(true);
                          }}
                        >
                          <UsersIcon className="h-4 w-4 mr-2" />
                          Chercher les contacts
                        </Button>
                      )}
                      
                      {/* Bouton "Afficher x de plus" / "Afficher moins" sous les contacts */}
                      {leadContacts.length > 0 && remainingCount > 0 && (
                        <div className="mt-2 flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandContacts(lead.id);
                            }}
                            className="text-[10px] h-6 px-2 gap-1 hover:bg-accent/50 transition-colors"
                          >
                            {isContactsExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                Moins
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                +{remainingCount}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Bloc 2 : Informations entreprise avec logo */}
                    <div className="flex-shrink-0 w-48 relative">
                      {/* Nom et logo */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">
                            {highlightText(company.name, searchQuery)}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{company.department}</span>
                          </div>
                        </div>
                        
                        {/* Logo */}
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{company.sector}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          {getHeadcountIcon(company.headcount)}
                          <span className="text-xs font-medium">{company.headcount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getRevenueIcon(company.ca)}
                          <span className="text-xs font-medium">{(company.ca / 1000000).toFixed(1)}M€</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-3 w-3" />
                          Site
                        </a>
                        <a 
                          href={company.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Linkedin className="h-3 w-3" />
                          LinkedIn
                        </a>
                      </div>
                    </div>

                  {/* Bloc 3 : Synthèse signal */}
                  <div className="flex-1 px-2">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-sm text-orange-900 leading-relaxed line-clamp-3">
                        {lead.signalSummary || "Aucun signal détecté pour cette entreprise."}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-orange-700 hover:text-orange-900 p-0 h-auto mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          const firstContact = leadContacts[0];
                          if (firstContact) {
                            handleContactClick(firstContact);
                          }
                        }}
                      >
                        Voir plus →
                      </Button>
                    </div>
                  </div>

                  {/* Statut */}
                  <Badge variant={getStatusBadgeVariant(getLeadStatus(lead.id))} className="w-36 justify-center">
                    {getLeadStatus(lead.id)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            );
          }

          // Mode ciblage avec la même structure que signal mais avec synthèse entreprise
          const sortedContacts = sortContactsByStatusAndHierarchy(leadContacts);
          const isContactsExpanded = expandedContactsLeads.has(lead.id);
          const displayedContacts = isContactsExpanded ? sortedContacts : sortedContacts.slice(0, 3);
          const remainingCount = sortedContacts.length - 3;

          return (
            <Card key={lead.id} className="hover:shadow-md transition-all duration-200 hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={() => handleSelectLead(lead.id)}
                    />
                  </div>

                  {/* Bloc 4 : Liste des contacts */}
                  <div className="w-64 space-y-2">
                    {leadContacts.length > 0 ? (
                      displayedContacts.map((contact, index) => (
                        <div
                          key={contact.id}
                          className="flex items-center gap-2 p-2 rounded border bg-card hover:bg-card/80 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactClick(contact);
                          }}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                            {(contact as any).personaPosition || index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">{contact.fullName}</p>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Mail className="h-3 w-3 text-primary flex-shrink-0 ml-2 cursor-pointer" />
                                </HoverCardTrigger>
                                <HoverCardContent className="w-auto">
                                  <p className="text-xs">{contact.email}</p>
                                </HoverCardContent>
                              </HoverCard>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                              {isContactInfoDiscovered(contact.id, 'phone') ? (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <Phone className="h-3 w-3 text-primary flex-shrink-0 ml-2 cursor-pointer" />
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-auto">
                                    <p className="text-xs">{contact.phone}</p>
                                  </HoverCardContent>
                                </HoverCard>
                              ) : (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <Phone 
                                      className="h-3 w-3 text-muted-foreground/30 flex-shrink-0 ml-2 cursor-pointer" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDiscoverRequest(contact.id, 'phone');
                                      }}
                                    />
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-auto">
                                    <p className="text-xs blur-sm select-none">{contact.phone}</p>
                                  </HoverCardContent>
                                </HoverCard>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(lead.id);
                          setShowPersonaDialog(true);
                        }}
                      >
                        <UsersIcon className="h-4 w-4 mr-2" />
                        Chercher les contacts
                      </Button>
                    )}
                    
                    {/* Bouton "Afficher x de plus" / "Afficher moins" sous les contacts */}
                    {leadContacts.length > 0 && remainingCount > 0 && (
                      <div className="mt-2 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandContacts(lead.id);
                          }}
                          className="text-[10px] h-6 px-2 gap-1 hover:bg-accent/50 transition-colors"
                        >
                          {isContactsExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3" />
                              Moins
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" />
                              +{remainingCount}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Bloc 2 : Informations entreprise avec logo */}
                  <div className="flex-shrink-0 w-48 relative">
                    {/* Nom et logo */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">
                          {highlightText(company.name, searchQuery)}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{company.department}</span>
                        </div>
                      </div>
                      
                      {/* Logo */}
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Briefcase className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{company.sector}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        {getHeadcountIcon(company.headcount)}
                        <span className="text-xs font-medium">{company.headcount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getRevenueIcon(company.ca)}
                        <span className="text-xs font-medium">{(company.ca / 1000000).toFixed(1)}M€</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="h-3 w-3" />
                        Site
                      </a>
                      <a 
                        href={company.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Linkedin className="h-3 w-3" />
                        LinkedIn
                      </a>
                    </div>
                  </div>

                {/* Bloc 3 : Synthèse entreprise */}
                <div className="flex-1 px-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 leading-relaxed line-clamp-3">
                      {highlightText(company.name, searchQuery)} - {company.sector.toLowerCase()} - {company.department}. 
                      {company.headcount} employés, {(company.ca / 1000000).toFixed(1)}M€ de chiffre d'affaires.
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-blue-700 hover:text-blue-900 p-0 h-auto mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        const firstContact = leadContacts[0];
                        if (firstContact) {
                          handleContactClick(firstContact);
                        }
                      }}
                    >
                      Voir plus →
                    </Button>
                  </div>
                </div>

                {/* Statut */}
                <Badge variant={getStatusBadgeVariant(getLeadStatus(lead.id))} className="w-36 justify-center">
                  {getLeadStatus(lead.id)}
                </Badge>
              </div>
              </CardContent>
            </Card>
          );
        })}

      {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Afficher:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                par page
              </span>
            </div>

            <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          </div>
        )}
      </div>
        </>
      )}

      {/* Dialog pour sélectionner les personas */}
      <Dialog open={showPersonaDialog} onOpenChange={setShowPersonaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Générer des contacts</DialogTitle>
            <DialogDescription>
              Sélectionnez les ciblages de contacts que vous souhaitez générer pour cette entreprise.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {loadingPersonas ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Chargement des ciblages...
              </div>
            ) : userPersonas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Vous devez créer 3 ciblages de contacts pour continuer.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPersonaDialog(false);
                    window.location.href = '/targeting';
                  }}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Créer mes ciblages
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Target className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Recherche en cascade</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          La recherche de contacts se fait automatiquement selon la hiérarchie de vos ciblages. 
                          Nous commençons par le ciblage prioritaire n°1, puis passons au suivant si nécessaire, 
                          jusqu'à atteindre le nombre de contacts demandé.
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">Votre hiérarchie de ciblages :</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowPersonaDialog(false);
                            window.location.href = '/targeting';
                          }}
                          className="h-7 text-xs"
                        >
                          <Target className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {userPersonas.map((persona, index) => (
                          <div key={persona.id} className="flex items-center gap-2 text-xs">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                              {index + 1}
                            </div>
                            <span className="font-medium flex-1">{persona.name}</span>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs py-0">
                                {persona.service}
                              </Badge>
                              <Badge variant="secondary" className="text-xs py-0">
                                {persona.decision_level}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total-contacts">Nombre total de contacts à rechercher</Label>
                  <Input
                    id="total-contacts"
                    type="number"
                    min={1}
                    max={50}
                    value={totalContactsToGenerate}
                    onChange={(e) => setTotalContactsToGenerate(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum : 50 contacts par entreprise
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleGenerateContacts}
                  disabled={generatingContacts}
                >
                  {generatingContacts ? 'Recherche...' : 'Chercher les contacts'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmation découverte */}
      <Dialog open={showDiscoverDialog} onOpenChange={setShowDiscoverDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Découvrir le contact</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir découvrir {contactToDiscover?.type === 'phone' ? 'le téléphone' : "l'email"} de ce contact pour 8 crédits ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDiscoverDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirmDiscover}>
              Confirmer (8 crédits)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog fiche contact détaillée */}
      <Dialog open={showContactDialog} onOpenChange={(open) => {
        setShowContactDialog(open);
        if (!open) {
          setShowActions(false);
          setContactNote('');
          setFollowUpDate('');
        }
      }}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          {selectedContact && (() => {
            const lead = leads.find(l => l.id === selectedContact.companyId);
            const company = lead ? mockCompanies.find(c => c.id === lead.companyId) : null;
            if (!company || !lead) return null;

            return (
              <div className="grid grid-cols-[320px_1fr] gap-6">
                {/* Bloc 1 : Informations entreprise (gauche) */}
                <Card className="p-4 bg-card h-fit">
                  <div className="space-y-4">
                    {/* Logo et nom */}
                    <div className="flex flex-col items-center pb-4 border-b">
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center mb-3">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-center text-sm">{highlightText(company.name, searchQuery)}</h3>
                    </div>

                    {/* Informations détaillées condensées */}
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Département</Label>
                          <div className="flex items-center gap-1.5 mt-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs">{company.department}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">SIRET</Label>
                          <p className="text-xs mt-1">{company.siret}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Adresse</Label>
                        <p className="text-xs mt-1 leading-tight">{company.address}</p>
                      </div>

                      <div className="pt-2 border-t">
                        <Label className="text-xs text-muted-foreground">Secteur</Label>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Briefcase className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs">{company.sector}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">NAF</Label>
                        <Badge variant="secondary" className="mt-1 text-xs">{company.naf}</Badge>
                      </div>

                      <div className="flex justify-between pt-2 border-t">
                        <div>
                          <Label className="text-xs text-muted-foreground">CA</Label>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <p className="text-xs font-semibold">{(company.ca / 1000000).toFixed(1)}M€</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Effectif</Label>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3 text-blue-600" />
                            <p className="text-xs font-semibold">{company.headcount}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          Site
                        </a>
                        <a 
                          href={company.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Linkedin className="h-3 w-3" />
                          LinkedIn
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Colonne droite : Blocs 2, 3, 4 + Note et dates */}
                <div className="space-y-4">
                  {/* Blocs 2, 3, 4 en ligne */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Bloc 2 : Informations du contact */}
                    <Card className="p-4 bg-background">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCircle2 className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">Contact</h3>
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <Label className="text-xs text-muted-foreground">Nom complet</Label>
                          <p className="text-sm font-medium mt-0.5">{selectedContact.fullName}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Poste</Label>
                          <p className="text-xs mt-0.5">{selectedContact.role}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Niveau</Label>
                          <Badge variant="secondary" className="mt-0.5 text-xs">{selectedContact.seniority}</Badge>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Service</Label>
                          <Badge variant="outline" className="mt-0.5 text-xs">{selectedContact.domain}</Badge>
                        </div>
                        <div className="pt-2 border-t space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs truncate">{selectedContact.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {isContactInfoDiscovered(selectedContact.id, 'phone') ? (
                              <span className="text-xs">{selectedContact.phone}</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs blur-sm select-none">{selectedContact.phone}</span>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs"
                                  onClick={() => handleDiscoverRequest(selectedContact.id, 'phone')}
                                >
                                  Découvrir
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Bloc 3 : Synthèse entreprise + Signal */}
                    <Card className="p-4 bg-background">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">Synthèse</h3>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {highlightText(company.name, searchQuery)} - {company.sector.toLowerCase()} - {company.department}. 
                          {company.headcount} employés, {(company.ca / 1000000).toFixed(1)}M€ CA.
                        </p>
                        
                        {lead?.signalSummary && (
                          <div className="pt-3 border-t">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Signal détecté</Label>
                            <div className="bg-orange-50 border border-orange-200 rounded p-2">
                              <p className="text-xs text-orange-900 leading-relaxed">
                                {lead.signalSummary}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Bloc 4 : Actions et Statut */}
                    <Card className="p-4 bg-background">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">Statut et Actions</h3>
                      </div>
                      
                      {/* Statut du contact */}
                      <div className="mb-4">
                        <Label className="text-xs font-medium mb-2 block">Statut</Label>
                        <Select
                          value={selectedContact?.status || 'Nouveau'}
                          onValueChange={(value) => {
                            if (selectedContact) {
                              handleStatusChange(selectedContact.id, value as ContactStatus);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full h-9 text-xs bg-background">
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            {STATUS_HIERARCHY.map((status) => (
                              <SelectItem key={status} value={status} className="text-xs">
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span>{status}</span>
                                  <Badge variant={getStatusBadgeVariant(status)} className="text-xs">
                                    {status}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="border-t pt-3">
                        <Button 
                          className="w-full mb-2 h-8 text-xs"
                          onClick={() => setShowActions(!showActions)}
                          variant="default"
                        >
                          <span className="flex-1">Actions</span>
                          <ChevronDown className={`h-3 w-3 transition-transform ${showActions ? 'rotate-180' : ''}`} />
                        </Button>
                        
                        {showActions && (
                          <div className="space-y-1.5">
                            <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                              {getActionName(1)}
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                              {getActionName(2)}
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                              {getActionName(3)}
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                              {getActionName(4)}
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                              {getActionName(5)}
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                              {getActionName(6)}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Note et dates en bas */}
                  <Card className="p-4 bg-card">
                    <div className="grid grid-cols-[1fr_200px] gap-4">
                      <div>
                        <Label htmlFor="note" className="text-xs font-medium mb-2 block">Note</Label>
                        <Textarea 
                          id="note"
                          placeholder="Ajoutez vos notes..."
                          className="min-h-[80px] resize-none text-xs"
                          value={contactNote}
                          onChange={(e) => setContactNote(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium mb-1.5 block">Date de création</Label>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date().toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium mb-1.5 block">Date de suivi</Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="date"
                              className="flex-1 h-8 text-xs"
                              value={followUpDate}
                              onChange={(e) => setFollowUpDate(e.target.value)}
                            />
                            <Button size="icon" variant="outline" className="h-8 w-8">
                              <Calendar className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            );
          })()}
          <DialogFooter className="mt-6">
            <Button onClick={handleSaveContact}>
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      </div>
  );
};

export default Prospects;
