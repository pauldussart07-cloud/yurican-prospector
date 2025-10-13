import { useState, useEffect, useRef } from 'react';
import { Phone, Mail, Linkedin, Globe, Building2, ChevronDown, ChevronRight, ChevronUp, Calendar, MessageSquare, ChevronLeft, TrendingUp, Users, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useActions } from '@/contexts/ActionsContext';
import { toast } from 'sonner';

type ContactStatus = 'Nouveau' | 'Engagé' | 'Discussion' | 'RDV' | 'Exclu';

const getStatusBadgeVariant = (status: ContactStatus) => {
  switch (status) {
    case 'Nouveau': return 'outline';
    case 'Engagé': return 'secondary';
    case 'Discussion': return 'default';
    case 'RDV': return 'default';
    case 'Exclu': return 'destructive' as any;
    default: return 'outline';
  }
};

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

// Déterminer le statut le plus avancé
const getLeadStatus = (contacts: any[]): ContactStatus => {
  const statusPriority: Record<ContactStatus, number> = {
    'Exclu': 0,
    'Nouveau': 1,
    'Engagé': 2,
    'Discussion': 3,
    'RDV': 4
  };
  
  let highestStatus: ContactStatus = 'Nouveau';
  let highestPriority = 0;
  
  contacts.forEach(contact => {
    const priority = statusPriority[contact.status as ContactStatus] || 0;
    if (priority > highestPriority) {
      highestPriority = priority;
      highestStatus = contact.status as ContactStatus;
    }
  });
  
  return highestStatus;
};

const ProspectsMobile = () => {
  const navigate = useNavigate();
  const { actions } = useActions();
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentContactIndices, setCurrentContactIndices] = useState<Map<string, number>>(new Map());
  const [editedStatus, setEditedStatus] = useState<ContactStatus>('Nouveau');
  const [editedNote, setEditedNote] = useState('');
  const [editedFollowUpDate, setEditedFollowUpDate] = useState('');
  const [editedEngagementDate, setEditedEngagementDate] = useState('');
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
  const [expandedNews, setExpandedNews] = useState<Set<string>>(new Set());
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'Tous'>('Tous');
  const [isContactSelectorOpen, setIsContactSelectorOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: contactsData } = await supabase
      .from('lead_contacts')
      .select('*')
      .eq('user_id', user.id);

    const transformedLeads = (leadsData || []).map(lead => ({
      id: lead.id,
      companyId: lead.company_id,
      companyName: lead.company_name,
      companyWebsite: lead.company_website,
      companyLinkedin: lead.company_linkedin,
      companyHeadcount: lead.company_headcount,
      companyCa: lead.company_ca,
      companyDepartment: lead.company_department,
      companySiret: lead.company_siret,
      companyAddress: lead.company_address,
      companySector: lead.company_sector,
      signalSummary: lead.signal_summary,
      newsContent: (lead as any).news_content,
      created_at: lead.created_at,
    }));

    const transformedContacts = (contactsData || []).map(contact => ({
      id: contact.id,
      leadId: contact.lead_id,
      fullName: contact.full_name,
      role: contact.role,
      email: contact.email || '',
      phone: contact.phone || '',
      linkedin: contact.linkedin || '',
      status: contact.status as ContactStatus,
      note: contact.note || '',
      followUpDate: contact.follow_up_date || '',
      engagementDate: contact.engagement_date || '',
    }));

    setLeads(transformedLeads);
    setContacts(transformedContacts);
    setLoading(false);
  };

  const handleContactClick = (contact: any) => {
    setSelectedContact(contact);
    setEditedStatus(contact.status);
    setEditedNote(contact.note || '');
    setEditedFollowUpDate(contact.followUpDate || '');
    setEditedEngagementDate(contact.engagementDate || '');
    setIsDrawerOpen(true);
  };

  const handleSaveContact = async () => {
    if (!selectedContact) return;

    // Mettre à jour l'état local immédiatement
    const updatedContact = {
      ...selectedContact,
      status: editedStatus,
      note: editedNote,
      followUpDate: editedFollowUpDate,
      engagementDate: editedEngagementDate,
    };
    setSelectedContact(updatedContact);

    // Mettre à jour dans la liste locale
    setContacts(prevContacts => 
      prevContacts.map(c => 
        c.id === selectedContact.id 
          ? updatedContact 
          : c
      )
    );

    // Sauvegarder en arrière-plan
    const { error } = await supabase
      .from('lead_contacts')
      .update({
        status: editedStatus,
        note: editedNote,
        follow_up_date: editedFollowUpDate || null,
        engagement_date: editedEngagementDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedContact.id);

    if (error) {
      toast.error('Erreur lors de la sauvegarde');
      // Recharger les données en cas d'erreur
      loadData();
    }
  };

  const autoSave = async () => {
    if (!selectedContact || !isDrawerOpen) return;
    await handleSaveContact();
  };

  const handleActionClick = async (actionId: number) => {
    const action = actions.find(a => a.id === actionId);
    if (!action || !selectedContact) return;

    if (action.type === 'email') {
      const contactLead = leadsWithContacts.find(l => 
        l.contacts.some(c => c.id === selectedContact.id)
      );
      const subject = action.emailSubject || '';
      const body = action.emailBody || '';
      window.open(`mailto:${selectedContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    } else if (action.type === 'meeting') {
      toast.info(`Création de réunion ${action.meetingPlatform}`);
    }
  };

  const handleOpenLink = (url: string) => {
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    }
  };

  const getCurrentContactIndex = (leadId: string) => {
    return currentContactIndices.get(leadId) || 0;
  };

  const handleNextContact = (leadId: string, totalContacts: number) => {
    const currentIndex = getCurrentContactIndex(leadId);
    const newIndex = (currentIndex + 1) % totalContacts;
    setCurrentContactIndices(new Map(currentContactIndices.set(leadId, newIndex)));
  };

  const handlePreviousContact = (leadId: string, totalContacts: number) => {
    const currentIndex = getCurrentContactIndex(leadId);
    const newIndex = currentIndex === 0 ? totalContacts - 1 : currentIndex - 1;
    setCurrentContactIndices(new Map(currentContactIndices.set(leadId, newIndex)));
  };

  const handleSwipeStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleSwipeEnd = () => {
    if (!selectedContact) return;
    
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    
    // Swipe à droite (ouvrir la page des listes)
    if (diff > swipeThreshold) {
      setIsDrawerOpen(false);
      setTimeout(() => {
        navigate('/lists');
      }, 300);
    }
    
    // Swipe à gauche (fermer le drawer)
    else if (diff < -swipeThreshold) {
      setSwipeDirection('left');
      setTimeout(() => {
        setIsDrawerOpen(false);
        setTimeout(() => setSwipeDirection(null), 100);
      }, 200);
    }
  };

  // Grouper les leads avec leurs contacts et appliquer les filtres
  const leadsWithContacts = leads.map(lead => ({
    ...lead,
    contacts: contacts.filter(c => c.leadId === lead.id)
  }))
    .filter(lead => lead.contacts.length > 0)
    .filter(lead => {
      // Filtre de recherche sémantique
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchCompany = lead.companyName.toLowerCase().includes(query);
        const matchContact = lead.contacts.some(contact => 
          contact.fullName.toLowerCase().includes(query)
        );
        return matchCompany || matchContact;
      }
      return true;
    })
    .filter(lead => {
      // Filtre de statut
      if (statusFilter !== 'Tous') {
        return lead.contacts.some(contact => contact.status === statusFilter);
      }
      return true;
    });

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Prospects Mobile</h1>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Prospects Mobile</h1>
        
        <div className="flex-1 flex gap-2 items-center justify-end">
          {/* Recherche sémantique */}
          <div className="relative flex-1 max-w-[200px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          
          {/* Filtre statut */}
          <Select value={statusFilter} onValueChange={(value: ContactStatus | 'Tous') => setStatusFilter(value)}>
            <SelectTrigger className="h-9 w-[120px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous</SelectItem>
              <SelectItem value="Nouveau">Nouveau</SelectItem>
              <SelectItem value="Engagé">Engagé</SelectItem>
              <SelectItem value="Discussion">Discussion</SelectItem>
              <SelectItem value="RDV">RDV</SelectItem>
              <SelectItem value="Exclu">Exclu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des entreprises avec contacts */}
      <div className="space-y-3">
        {leadsWithContacts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Aucun prospect avec contacts
              </p>
            </CardContent>
          </Card>
        ) : (
          leadsWithContacts.map(lead => {
            const currentIndex = getCurrentContactIndex(lead.id);
            const displayedContact = lead.contacts[currentIndex];

            return (
              <Card key={lead.id}>
                <CardContent className="pt-6 space-y-3">
                  {/* Contact affiché */}
                  <div className="flex items-center gap-2 py-2">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleContactClick(displayedContact)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{displayedContact.fullName}</span>
                        <span className="text-xs text-muted-foreground truncate">{displayedContact.role}</span>
                        <Badge variant={getStatusBadgeVariant(displayedContact.status)} className="text-xs">
                          {displayedContact.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 flex-shrink-0">
                      {displayedContact.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`mailto:${displayedContact.email}`, '_blank');
                          }}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      {displayedContact.phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${displayedContact.phone}`, '_blank');
                          }}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      {displayedContact.phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`sms:${displayedContact.phone}`, '_blank');
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                      {displayedContact.linkedin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLink(displayedContact.linkedin);
                          }}
                        >
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleContactClick(displayedContact)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Changer le contact par défaut */}
                  {lead.contacts.length > 1 && (
                    <div className="pt-1">
                      <Select 
                        value={currentIndex.toString()} 
                        onValueChange={(value) => {
                          const newIndex = parseInt(value);
                          setCurrentContactIndices(new Map(currentContactIndices.set(lead.id, newIndex)));
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Changer le contact par défaut" />
                        </SelectTrigger>
                        <SelectContent>
                          {lead.contacts.map((contact, index) => (
                            <SelectItem key={contact.id} value={index.toString()}>
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span>{contact.fullName} - {contact.role}</span>
                                <Badge variant={getStatusBadgeVariant(contact.status as ContactStatus)} className="text-xs">
                                  {contact.status}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* En-tête entreprise */}
                  <div className="pt-3 border-t">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold truncate">{lead.companyName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {lead.companyHeadcount && (
                          <span className="whitespace-nowrap bg-muted/50 rounded px-2 py-1 flex items-center gap-1 text-xs">
                            {getHeadcountIcon(lead.companyHeadcount)}
                            <span className="font-semibold">{lead.companyHeadcount}</span>
                          </span>
                        )}
                        {lead.companyCa && (
                          <span className="whitespace-nowrap bg-muted/50 rounded px-2 py-1 flex items-center gap-1 text-xs">
                            {getRevenueIcon(lead.companyCa)}
                            <span className="font-semibold">{(lead.companyCa / 1000000).toFixed(1)}M€</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <Badge variant={getStatusBadgeVariant(getLeadStatus(lead.contacts))} className="text-xs">
                        {getLeadStatus(lead.contacts)}
                      </Badge>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        {lead.companyWebsite && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenLink(lead.companyWebsite)}
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                        )}
                        {lead.companyLinkedin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenLink(lead.companyLinkedin)}
                          >
                            <Linkedin className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Drawer fiche contact */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent 
          onTouchStart={handleSwipeStart}
          onTouchMove={handleSwipeMove}
          onTouchEnd={handleSwipeEnd}
          className={`h-screen transition-all duration-200 ${
            swipeDirection === 'left' ? 'translate-x-4 opacity-80' : 
            swipeDirection === 'right' ? '-translate-x-4 opacity-80' : 
            ''
          }`}
        >
          <DrawerHeader className="text-left pb-1 pt-2 px-4">
            <DrawerTitle className="text-base font-bold">Fiche Contact</DrawerTitle>
          </DrawerHeader>

          {selectedContact && (() => {
            const contactLead = leadsWithContacts.find(l => 
              l.contacts.some(c => c.id === selectedContact.id)
            );
            
            return (
              <div className="px-3 pb-3 space-y-2 flex-1 overflow-y-auto">
                {/* BLOC 1 - Entreprise */}
                {contactLead && (
                  <Card>
                    <CardContent className="pt-2 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="font-semibold text-sm">{contactLead.companyName}</div>
                          
                          <div className="text-xs space-y-0.5">
                            {(contactLead.companyDepartment || contactLead.companySector) && (
                              <div className="text-muted-foreground">
                                {contactLead.companyDepartment && <span>{contactLead.companyDepartment}</span>}
                                {contactLead.companyDepartment && contactLead.companySector && <span> • </span>}
                                {contactLead.companySector && <span>{contactLead.companySector}</span>}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3 flex-wrap">
                              {contactLead.companyHeadcount && (
                                <span className="flex items-center gap-1">
                                  {getHeadcountIcon(contactLead.companyHeadcount)}
                                  <span className="font-medium">{contactLead.companyHeadcount} pers.</span>
                                </span>
                              )}
                              {contactLead.companyCa && (
                                <span className="flex items-center gap-1">
                                  {getRevenueIcon(contactLead.companyCa)}
                                  <span className="font-medium">{(contactLead.companyCa / 1000000).toFixed(1)}M€</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getStatusBadgeVariant(getLeadStatus(contactLead.contacts))} className="text-xs">
                            {getLeadStatus(contactLead.contacts)}
                          </Badge>
                          <div className="flex gap-1">
                            {contactLead.companyWebsite && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleOpenLink(contactLead.companyWebsite)}
                              >
                                <Globe className="h-4 w-4" />
                              </Button>
                            )}
                            {contactLead.companyLinkedin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleOpenLink(contactLead.companyLinkedin)}
                              >
                                <Linkedin className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* BLOC 2 - Dates */}
                <Card>
                  <CardContent className="pt-2 pb-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Date engagement</Label>
                        <Input
                          type="date"
                          className="h-8 text-xs mt-0.5"
                          value={editedEngagementDate}
                          onChange={(e) => {
                            setEditedEngagementDate(e.target.value);
                            setTimeout(() => autoSave(), 500);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Date suivi</Label>
                        <Input
                          type="date"
                          className="h-8 text-xs mt-0.5"
                          value={editedFollowUpDate}
                          onChange={(e) => {
                            setEditedFollowUpDate(e.target.value);
                            setTimeout(() => autoSave(), 500);
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* BLOC 3 - Contact */}
                <Card>
                  <CardContent className="pt-2 pb-2">
                    {contactLead && contactLead.contacts.length > 1 ? (
                      <Popover open={isContactSelectorOpen} onOpenChange={setIsContactSelectorOpen}>
                        <PopoverTrigger asChild>
                          <div className="cursor-pointer hover:bg-accent/50 -mx-4 -mt-2 px-4 pt-2 pb-2 rounded-t-lg transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <div className="font-semibold text-sm">{selectedContact.fullName}</div>
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">{selectedContact.role}</div>
                              </div>
                              
                              <Select value={editedStatus} onValueChange={(value: ContactStatus) => {
                                setEditedStatus(value);
                                setTimeout(() => autoSave(), 500);
                              }}>
                                <SelectTrigger className="h-7 w-[110px] text-[10px]" onClick={(e) => e.stopPropagation()}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Nouveau">Nouveau</SelectItem>
                                  <SelectItem value="Engagé">Engagé</SelectItem>
                                  <SelectItem value="Discussion">Discussion</SelectItem>
                                  <SelectItem value="RDV">RDV</SelectItem>
                                  <SelectItem value="Exclu">Exclu</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <div className="max-h-[300px] overflow-y-auto">
                            {contactLead.contacts.map((contact) => (
                              <button
                                key={contact.id}
                                className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                                  contact.id === selectedContact.id ? 'bg-accent/50' : ''
                                }`}
                                onClick={() => {
                                  handleContactClick(contact);
                                  setIsContactSelectorOpen(false);
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{contact.fullName}</div>
                                    <div className="text-xs text-muted-foreground">{contact.role}</div>
                                  </div>
                                  <Badge variant={getStatusBadgeVariant(contact.status as ContactStatus)} className="text-xs">
                                    {contact.status}
                                  </Badge>
                                </div>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{selectedContact.fullName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{selectedContact.role}</div>
                        </div>
                        
                        <Select value={editedStatus} onValueChange={(value: ContactStatus) => {
                          setEditedStatus(value);
                          setTimeout(() => autoSave(), 500);
                        }}>
                          <SelectTrigger className="h-7 w-[110px] text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Nouveau">Nouveau</SelectItem>
                            <SelectItem value="Engagé">Engagé</SelectItem>
                            <SelectItem value="Discussion">Discussion</SelectItem>
                            <SelectItem value="RDV">RDV</SelectItem>
                            <SelectItem value="Exclu">Exclu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* BLOC 4 - Actions */}
                <Card>
                  <CardContent className="pt-2 pb-2">
                    <div className="grid grid-cols-3 gap-2 items-start">
                      {/* Partie gauche - Roulette d'action */}
                      <div>
                        <Select 
                          value={selectedAction?.toString() || ""} 
                          onValueChange={(value) => {
                            setSelectedAction(parseInt(value));
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Sélectionner une action" />
                          </SelectTrigger>
                          <SelectContent>
                            {actions.map((action) => (
                              <SelectItem key={action.id} value={action.id.toString()}>
                                {action.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Centre - Boutons de communication */}
                      <div className="flex flex-col gap-1">
                        {selectedContact.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] whitespace-nowrap"
                            onClick={() => window.open(`tel:${selectedContact.phone}`, '_blank')}
                          >
                            <Phone className="h-3 w-3 mr-0.5" />
                            Tel
                          </Button>
                        )}
                        {selectedContact.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] whitespace-nowrap"
                            onClick={() => window.open(`https://wa.me/${selectedContact.phone.replace(/\s/g, '')}`, '_blank')}
                          >
                            <MessageSquare className="h-3 w-3 mr-0.5" />
                            WhatsApp
                          </Button>
                        )}
                        {selectedContact.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] whitespace-nowrap"
                            onClick={() => window.open(`sms:${selectedContact.phone}`, '_blank')}
                          >
                            <MessageSquare className="h-3 w-3 mr-0.5" />
                            SMS
                          </Button>
                        )}
                      </div>
                      
                      {/* Droite - Bouton GO et dernière action */}
                      <div className="flex flex-col gap-1.5 min-w-[70px]">
                        <Button
                          className="h-8 w-full font-semibold text-xs"
                          disabled={!selectedAction}
                          onClick={() => {
                            if (!selectedAction) return;
                            const action = actions.find(a => a.id === selectedAction);
                            if (action) {
                              if (action.type === 'email') {
                                const subject = action.emailSubject || '';
                                const body = action.emailBody || '';
                                window.open(`mailto:${selectedContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                              } else if (action.type === 'meeting') {
                                // Logique de création de réunion
                              }
                              setLastAction(action.name);
                              toast.success('Action effectuée !');
                            }
                          }}
                        >
                          GO
                        </Button>
                        <div className="bg-muted/50 rounded-md p-1.5 min-h-[40px]">
                          <div className="text-[9px] font-semibold text-muted-foreground mb-0.5">Dernière:</div>
                          {lastAction ? (
                            <div className="text-[10px] line-clamp-2 text-foreground">{lastAction}</div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground italic">Aucune</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* BLOC 5 - Synthèse et Note */}
                <Card>
                  <CardContent className="pt-2 pb-2">
                    <div className="flex border-b mb-2">
                      <button
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          !expandedNews.has('note-tab') 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => {
                          const newExpanded = new Set(expandedNews);
                          newExpanded.delete('note-tab');
                          setExpandedNews(newExpanded);
                        }}
                      >
                        Synthèse
                      </button>
                      <button
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          expandedNews.has('note-tab') 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => {
                          const newExpanded = new Set(expandedNews);
                          newExpanded.add('note-tab');
                          setExpandedNews(newExpanded);
                        }}
                      >
                        Note
                      </button>
                    </div>
                    
                    {!expandedNews.has('note-tab') ? (
                      <div className="space-y-2">
                        {contactLead?.signalSummary && (
                          <div>
                            <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">Site web</div>
                            <p className={`text-[10px] break-words ${expandedSummaries.has(`drawer-${contactLead.id}`) ? '' : 'line-clamp-2'}`}>
                              {contactLead.signalSummary}
                            </p>
                            {contactLead.signalSummary.length > 150 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-1.5 text-[9px] mt-0.5"
                                onClick={() => {
                                  const newExpanded = new Set(expandedSummaries);
                                  const key = `drawer-${contactLead.id}`;
                                  if (expandedSummaries.has(key)) {
                                    newExpanded.delete(key);
                                  } else {
                                    newExpanded.add(key);
                                  }
                                  setExpandedSummaries(newExpanded);
                                }}
                              >
                                {expandedSummaries.has(`drawer-${contactLead.id}`) ? 'Afficher moins' : 'Afficher plus'}
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {contactLead?.newsContent && (
                          <div>
                            <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">Actualité</div>
                            <p className={`text-[10px] break-words ${expandedSummaries.has(`drawer-news-${contactLead.id}`) ? '' : 'line-clamp-2'}`}>
                              {contactLead.newsContent}
                            </p>
                            {contactLead.newsContent.length > 150 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-1.5 text-[9px] mt-0.5"
                                onClick={() => {
                                  const newExpanded = new Set(expandedSummaries);
                                  const key = `drawer-news-${contactLead.id}`;
                                  if (expandedSummaries.has(key)) {
                                    newExpanded.delete(key);
                                  } else {
                                    newExpanded.add(key);
                                  }
                                  setExpandedSummaries(newExpanded);
                                }}
                              >
                                {expandedSummaries.has(`drawer-news-${contactLead.id}`) ? 'Afficher moins' : 'Afficher plus'}
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {!contactLead?.signalSummary && !contactLead?.newsContent && (
                          <p className="text-[10px] text-muted-foreground italic">Aucune synthèse disponible</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Textarea
                          value={editedNote}
                          onChange={(e) => {
                            setEditedNote(e.target.value);
                            setTimeout(() => autoSave(), 1000);
                          }}
                          placeholder="Ajouter une note..."
                          rows={4}
                          className="text-xs"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ProspectsMobile;
