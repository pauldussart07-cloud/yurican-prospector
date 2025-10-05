import { useState, useMemo, useEffect } from 'react';
import { Phone, Mail, Users as UsersIcon, Building2, MapPin, Briefcase, ExternalLink, Linkedin, TrendingUp, Users, ArrowUp, ArrowDown, ChevronDown, ChevronRight, Globe, ThumbsUp, ThumbsDown, Calendar, UserCircle2, Target, Medal } from 'lucide-react';
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
  const [leads] = useState<Lead[]>(mockLeads);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [generatingContacts, setGeneratingContacts] = useState(false);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [contactNote, setContactNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [discoveredContacts, setDiscoveredContacts] = useState<Set<string>>(new Set());
  const [showDiscoverDialog, setShowDiscoverDialog] = useState(false);
  const [contactToDiscover, setContactToDiscover] = useState<{ id: string; type: 'phone' | 'email' } | null>(null);
  
  // Persona selector state
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [contactCount, setContactCount] = useState(3);
  const [userPersonas, setUserPersonas] = useState<any[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);

  // Pagination et filtres
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'ciblage' | 'signal'>('ciblage');
  const [sortCriteria, setSortCriteria] = useState<'name' | 'sector' | 'revenue' | 'headcount' | 'department' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');


  const handleGenerateContacts = async () => {
    if (!selectedLead || selectedPersonas.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins un ciblage.',
        variant: 'destructive',
      });
      return;
    }

    const lead = leads.find(l => l.id === selectedLead);
    const company = mockCompanies.find(c => c.id === lead?.companyId);
    
    if (!company) return;

    setGeneratingContacts(true);
    
    try {
      // Récupérer les objets personas complets depuis les noms sélectionnés
      const selectedPersonaObjects = userPersonas.filter(p => 
        selectedPersonas.includes(p.name)
      );
      
      const newContacts = await contactsService.generateContacts({
        companyId: company.id,
        companyName: company.name,
        personas: selectedPersonaObjects,
        count: contactCount,
      });

      setContacts([...contacts, ...newContacts]);
      
      toast({
        title: 'Contacts trouvés',
        description: `${newContacts.length} contact${newContacts.length > 1 ? 's ont' : ' a'} été ajouté${newContacts.length > 1 ? 's' : ''}.`,
      });

      setShowPersonaDialog(false);
      setSelectedPersonas([]);
      setContactCount(3);
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

  const handlePersonaToggle = (personaName: string) => {
    setSelectedPersonas(prev =>
      prev.includes(personaName)
        ? prev.filter(p => p !== personaName)
        : [...prev, personaName]
    );
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

  // Filtrer et trier les leads
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads;

    // Filtrer par mode (signal = leads chauds uniquement)
    if (viewMode === 'signal') {
      filtered = filtered.filter(lead => lead.isHotSignal);
    }

    const leadsWithCompanies = filtered
      .map(lead => ({
        lead,
        company: mockCompanies.find(c => c.id === lead.companyId)
      }))
      .filter(item => item.company);

    return leadsWithCompanies.sort((a, b) => {
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
  }, [leads, viewMode, sortCriteria, sortDirection]);

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

  const handleSaveContact = () => {
    if (!selectedContact) return;

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

  const handleConfirmDiscover = () => {
    if (!contactToDiscover) return;
    
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Prospects</h1>
        <Badge variant="outline" className="text-sm bg-white border-border flex items-center absolute left-1/2 transform -translate-x-1/2">
          {filteredAndSortedLeads.length} lead{filteredAndSortedLeads.length > 1 ? 's' : ''}
        </Badge>
      </div>

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
                      Afficher {itemsPerPage}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background">
                    <DropdownMenuItem onClick={() => setItemsPerPage(10)}>
                      10
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setItemsPerPage(25)}>
                      25
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setItemsPerPage(50)}>
                      50
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setItemsPerPage(100)}>
                      100
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {paginatedLeads.map(({ lead, company }) => {
          const leadContacts = contacts.filter(c => c.companyId === lead.companyId);
          const isExpanded = expandedLeads.has(lead.id);

          if (!company) return null;

          // En mode signal, affichage différent
          if (viewMode === 'signal') {
            return (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeads.has(lead.id)}
                        onCheckedChange={() => handleSelectLead(lead.id)}
                      />
                    </div>

                    {/* Bloc 1 : Logo entreprise */}
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Bloc 2 : Raison sociale, département, secteur, effectif, CA, liens */}
                    <div className="flex-shrink-0 w-48">
                      <h3 className="text-sm font-semibold truncate">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{company.department}</span>
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

                    {/* Signal résumé - élargi avec 3 lignes max */}
                    {lead.signalSummary && (
                      <div className="flex-1 px-2">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <p className="text-sm text-orange-900 leading-relaxed line-clamp-3">
                            {lead.signalSummary}
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
                    )}

                    {/* Statut */}
                    <Select defaultValue={lead.status}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">Nouveau</SelectItem>
                        <SelectItem value="A_TRAITER">À traiter</SelectItem>
                        <SelectItem value="A_SUIVRE">À suivre</SelectItem>
                        <SelectItem value="GO">GO</SelectItem>
                        <SelectItem value="NO_GO">NO GO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Section contacts dépliable */}
                  {leadContacts.length > 0 && (
                    <Collapsible open={isExpanded} onOpenChange={() => toggleLeadExpanded(lead.id)}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-3 justify-start gap-2"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <UsersIcon className="h-4 w-4" />
                          {leadContacts.length} contact{leadContacts.length > 1 ? 's' : ''}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-2">
                        {leadContacts.map((contact) => (
                          <Card
                            key={contact.id}
                            className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleContactClick(contact)}
                          >
                            <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  <Medal className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-xs font-semibold text-primary">Top {(leadContacts.indexOf(contact) % 3) + 1}</span>
                                </div>
                                <p className="font-medium text-sm">{contact.fullName}</p>
                                <p className="text-xs text-muted-foreground">{contact.role}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="text-xs">{contact.seniority}</Badge>
                                <Badge variant="secondary" className="text-xs">{contact.domain}</Badge>
                              </div>
                            </div>
                              
                            {/* Note et date de suivi */}
                            <div className="flex-1 flex flex-col gap-1 px-4">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Suivi: {(contact as any).followUpDate ? new Date((contact as any).followUpDate).toLocaleDateString('fr-FR') : '-'}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-muted-foreground">Note :</span>
                                {(contact as any).note ? (
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
                                      {(contact as any).note}
                                    </p>
                                    {(contact as any).note.length > 50 && (
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleContactClick(contact);
                                        }}
                                      >
                                        Afficher plus
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </div>
                            </div>
                              
                              {/* Mail et téléphone */}
                              <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <a 
                                  href={`mailto:${contact.email}`}
                                  className="flex items-center gap-2 px-2 py-1 rounded border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                                >
                                  <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                  <span className="text-xs text-primary font-medium">
                                    {contact.email}
                                  </span>
                                </a>
                                {isContactInfoDiscovered(contact.id, 'phone') ? (
                                  <a 
                                    href={`tel:${contact.phone}`}
                                    className="flex items-center gap-2 px-2 py-1 rounded border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                                  >
                                    <Phone className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    <span className="text-xs text-primary font-medium">
                                      {contact.phone}
                                    </span>
                                  </a>
                                ) : (
                                  <div className="flex flex-col gap-1 px-2 py-1 rounded border border-muted-foreground/20 bg-muted/30">
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-auto p-0 text-xs self-start"
                                      onClick={() => handleDiscoverRequest(contact.id, 'phone')}
                                    >
                                      Découvrir
                                    </Button>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                      <span className="text-xs blur-sm select-none">{contact.phone}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Bouton pour ajouter des contacts si aucun */}
                  {leadContacts.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => {
                        setSelectedLead(lead.id);
                        setShowPersonaDialog(true);
                      }}
                    >
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Chercher les contacts
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          }

          // Mode ciblage avec la même structure que signal mais avec synthèse entreprise
          return (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={() => handleSelectLead(lead.id)}
                    />
                  </div>

                  {/* Bloc 1 : Logo entreprise */}
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Bloc 2 : Raison sociale, département, secteur, effectif, CA, liens */}
                  <div className="flex-shrink-0 w-48">
                    <h3 className="text-sm font-semibold truncate">
                      {company.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{company.department}</span>
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

                  {/* Synthèse entreprise */}
                  <div className="flex-1 px-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900 leading-relaxed line-clamp-3">
                        {company.name} - {company.sector.toLowerCase()} - {company.department}. 
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
                  <Select defaultValue={lead.status}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">Nouveau</SelectItem>
                      <SelectItem value="A_TRAITER">À traiter</SelectItem>
                      <SelectItem value="A_SUIVRE">À suivre</SelectItem>
                      <SelectItem value="GO">GO</SelectItem>
                      <SelectItem value="NO_GO">NO GO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Section contacts dépliable */}
                {leadContacts.length > 0 && (
                  <Collapsible open={isExpanded} onOpenChange={() => toggleLeadExpanded(lead.id)}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 justify-start gap-2"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <UsersIcon className="h-4 w-4" />
                        {leadContacts.length} contact{leadContacts.length > 1 ? 's' : ''}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {leadContacts.map((contact) => (
                        <Card
                          key={contact.id}
                          className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleContactClick(contact)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  <Medal className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-xs font-semibold text-primary">Top {(leadContacts.indexOf(contact) % 3) + 1}</span>
                                </div>
                                <p className="font-medium text-sm">{contact.fullName}</p>
                                <p className="text-xs text-muted-foreground">{contact.role}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="text-xs">{contact.seniority}</Badge>
                                <Badge variant="secondary" className="text-xs">{contact.domain}</Badge>
                              </div>
                            </div>
                            
                            {/* Note et date de suivi */}
                            <div className="flex-1 flex flex-col gap-1 px-4">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Suivi: {(contact as any).followUpDate ? new Date((contact as any).followUpDate).toLocaleDateString('fr-FR') : '-'}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-muted-foreground">Note :</span>
                                {(contact as any).note ? (
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
                                      {(contact as any).note}
                                    </p>
                                    {(contact as any).note.length > 50 && (
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleContactClick(contact);
                                        }}
                                      >
                                        Afficher plus
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Mail et téléphone */}
                            <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <a 
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-2 px-2 py-1 rounded border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                              >
                                <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                <span className="text-xs text-primary font-medium">
                                  {contact.email}
                                </span>
                              </a>
                              {isContactInfoDiscovered(contact.id, 'phone') ? (
                                <a 
                                  href={`tel:${contact.phone}`}
                                  className="flex items-center gap-2 px-2 py-1 rounded border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                                >
                                  <Phone className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                  <span className="text-xs text-primary font-medium">
                                    {contact.phone}
                                  </span>
                                </a>
                              ) : (
                                <div className="flex flex-col gap-1 px-2 py-1 rounded border border-muted-foreground/20 bg-muted/30">
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs self-start"
                                    onClick={() => handleDiscoverRequest(contact.id, 'phone')}
                                  >
                                    Découvrir
                                  </Button>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="text-xs blur-sm select-none">{contact.phone}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Bouton pour ajouter des contacts si aucun */}
                {leadContacts.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => {
                      setSelectedLead(lead.id);
                      setShowPersonaDialog(true);
                    }}
                  >
                    <UsersIcon className="h-4 w-4 mr-2" />
                    Chercher les contacts
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-6">
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
        )}
      </div>

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
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Ciblages de contacts
                  </Label>
                  {userPersonas.map((persona, index) => (
                    <div key={persona.id} className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Checkbox
                            id={persona.id}
                            checked={selectedPersonas.includes(persona.name)}
                            onCheckedChange={() => handlePersonaToggle(persona.name)}
                          />
                          <label
                            htmlFor={persona.id}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {persona.name}
                          </label>
                        </div>
                        <div className="flex gap-2 ml-6">
                          <Badge variant="outline" className="text-xs">
                            {persona.service}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {persona.decision_level}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="count">Nombre de contacts par ciblage</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={10}
                    value={contactCount}
                    onChange={(e) => setContactCount(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Total : {selectedPersonas.length * contactCount} contact{selectedPersonas.length * contactCount > 1 ? 's' : ''}
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleGenerateContacts}
                  disabled={generatingContacts || selectedPersonas.length === 0}
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
            const company = mockCompanies.find(c => c.id === selectedContact.companyId);
            const lead = leads.find(l => l.companyId === selectedContact.companyId);
            if (!company) return null;

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
                      <h3 className="font-semibold text-center text-sm">{company.name}</h3>
                    </div>

                    {/* Informations détaillées condensées */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <Label className="text-xs text-muted-foreground">Département</Label>
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs">{company.department}</p>
                        </div>
                      </div>

                      <div>
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

                      <div className="pt-2 border-t">
                        <Label className="text-xs text-muted-foreground">SIRET</Label>
                        <p className="text-xs mt-1">{company.siret}</p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Adresse</Label>
                        <p className="text-xs mt-1 leading-tight">{company.address}</p>
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
                          {company.name} - {company.sector.toLowerCase()} - {company.department}. 
                          {company.headcount} employés, {(company.ca / 1000000).toFixed(1)}M€ CA.
                        </p>
                        
                        {viewMode === 'signal' && lead?.signalSummary && (
                          <div className="pt-3 border-t">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Signal</Label>
                            <div className="bg-orange-50 border border-orange-200 rounded p-2">
                              <p className="text-xs text-orange-900 leading-relaxed">
                                {lead.signalSummary}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Bloc 4 : Actions */}
                    <Card className="p-4 bg-background">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">Actions</h3>
                      </div>
                      <Button 
                        className="w-full mb-2 h-8 text-xs"
                        onClick={() => setShowActions(!showActions)}
                        variant="default"
                      >
                        <span className="flex-1">Call to Action</span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${showActions ? 'rotate-180' : ''}`} />
                      </Button>
                      
                      {showActions && (
                        <div className="space-y-1.5">
                          <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                            Action 1
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                            Action 2
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                            Action 3
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                            Action 4
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                            Action 5
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs">
                            Action 6
                          </Button>
                        </div>
                      )}
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
  );
};

export default Prospects;
