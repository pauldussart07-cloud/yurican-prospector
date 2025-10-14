import { useState, useEffect } from 'react';
import { Search, Building2, User, Phone, Mail, Linkedin, Globe, ChevronRight, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useActions } from '@/contexts/ActionsContext';
import WhatsAppIcon from '@/components/WhatsAppIcon';

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
  const { actions } = useActions();
  const [activeTab, setActiveTab] = useState('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'Tous'>('Tous');
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editedStatus, setEditedStatus] = useState<ContactStatus>('Nouveau');
  const [editedNote, setEditedNote] = useState('');
  const [editedFollowUpDate, setEditedFollowUpDate] = useState('');
  const [editedEngagementDate, setEditedEngagementDate] = useState('');
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

    setLeads(leadsData || []);
    setContacts(contactsData || []);
    setLoading(false);
  };

  const handleContactClick = (contact: any) => {
    setSelectedContact(contact);
    setEditedStatus(contact.status);
    setEditedNote(contact.note || '');
    setEditedFollowUpDate(contact.follow_up_date || '');
    setEditedEngagementDate(contact.engagement_date || '');
    setIsDrawerOpen(true);
  };

  const handleLeadClick = (lead: any) => {
    // Trouver tous les contacts de cette entreprise
    const leadContacts = contacts.filter(c => c.lead_id === lead.id);
    if (leadContacts.length === 0) return;
    
    // Trouver le contact avec le statut le plus élevé
    const statusPriority: Record<ContactStatus, number> = {
      'Exclu': 0,
      'Nouveau': 1,
      'Engagé': 2,
      'Discussion': 3,
      'RDV': 4
    };
    
    const highestContact = leadContacts.reduce((prev, current) => {
      const prevPriority = statusPriority[prev.status as ContactStatus] || 0;
      const currentPriority = statusPriority[current.status as ContactStatus] || 0;
      return currentPriority > prevPriority ? current : prev;
    });
    
    handleContactClick(highestContact);
  };

  const handleSaveContact = async () => {
    if (!selectedContact) return;

    const updatedContact = {
      ...selectedContact,
      status: editedStatus,
      note: editedNote,
      follow_up_date: editedFollowUpDate,
      engagement_date: editedEngagementDate,
    };
    setSelectedContact(updatedContact);

    setContacts(prevContacts => 
      prevContacts.map(c => 
        c.id === selectedContact.id 
          ? updatedContact 
          : c
      )
    );

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
      loadData();
    }
  };

  const autoSave = async () => {
    if (!selectedContact || !isDrawerOpen) return;
    await handleSaveContact();
  };

  const handleOpenLink = (url: string) => {
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    }
  };

  // Filtrer les entreprises
  const filteredLeads = leads.filter(lead => {
    const matchSearch = !searchQuery || lead.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'Tous' || lead.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Filtrer les contacts
  const filteredContacts = contacts.filter(contact => {
    const matchSearch = !searchQuery || contact.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'Tous' || contact.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <h1 className="text-xl font-bold mb-4">Prospects</h1>

        {/* Recherche et filtre */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={activeTab === 'companies' ? 'Rechercher une entreprise...' : 'Rechercher un contact...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value: ContactStatus | 'Tous') => setStatusFilter(value)}>
            <SelectTrigger className="h-10 w-[130px]">
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full rounded-none border-b bg-transparent p-0">
          <TabsTrigger 
            value="companies" 
            className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Entreprises ({filteredLeads.length})
          </TabsTrigger>
          <TabsTrigger 
            value="contacts"
            className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary"
          >
            <User className="h-4 w-4 mr-2" />
            Contacts ({filteredContacts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="p-4 space-y-3 mt-0">
          {filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  Aucune entreprise trouvée
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map(lead => (
              <Card key={lead.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleLeadClick(lead)}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{lead.company_name}</div>
                      {lead.company_sector && (
                        <div className="text-xs text-muted-foreground mt-1">{lead.company_sector}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {lead.company_headcount && (
                          <span className="text-xs bg-muted/50 rounded px-2 py-1">
                            {lead.company_headcount} pers.
                          </span>
                        )}
                        {lead.company_ca && (
                          <span className="text-xs bg-muted/50 rounded px-2 py-1">
                            {(lead.company_ca / 1000000).toFixed(1)}M€
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(lead.status as ContactStatus)} className="text-xs">
                      {lead.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="contacts" className="p-4 space-y-3 mt-0">
          {filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  Aucun contact trouvé
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredContacts.map(contact => {
              const contactLead = leads.find(l => l.id === contact.lead_id);
              return (
                <Card key={contact.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleContactClick(contact)}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{contact.full_name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{contact.role}</div>
                        {contactLead && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {contactLead.company_name}
                          </div>
                        )}
                      </div>
                      <Badge variant={getStatusBadgeVariant(contact.status as ContactStatus)} className="text-xs">
                        {contact.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Drawer fiche contact */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader className="text-left pb-2 pt-3 px-4">
            <DrawerTitle className="text-base font-bold">Fiche Contact</DrawerTitle>
          </DrawerHeader>

          {selectedContact && (() => {
            const contactLead = leads.find(l => l.id === selectedContact.lead_id);
            
            return (
              <div className="px-3 pb-3 space-y-2 flex-1 overflow-y-auto">
                {/* BLOC 1 - Entreprise */}
                {contactLead && (
                  <Card>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="font-semibold text-sm">{contactLead.company_name}</div>
                          
                          <div className="text-xs space-y-0.5">
                            {(contactLead.company_department || contactLead.company_sector) && (
                              <div className="text-muted-foreground">
                                {contactLead.company_department && <span>{contactLead.company_department}</span>}
                                {contactLead.company_department && contactLead.company_sector && <span> • </span>}
                                {contactLead.company_sector && <span>{contactLead.company_sector}</span>}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3 flex-wrap">
                              {contactLead.company_headcount && (
                                <span className="text-xs bg-muted/50 rounded px-2 py-1">
                                  {contactLead.company_headcount} pers.
                                </span>
                              )}
                              {contactLead.company_ca && (
                                <span className="text-xs bg-muted/50 rounded px-2 py-1">
                                  {(contactLead.company_ca / 1000000).toFixed(1)}M€
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          {contactLead.company_website && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleOpenLink(contactLead.company_website)}
                            >
                              <Globe className="h-4 w-4" />
                            </Button>
                          )}
                          {contactLead.company_linkedin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleOpenLink(contactLead.company_linkedin)}
                            >
                              <Linkedin className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* BLOC 2 - Dates */}
                <Card>
                  <CardContent className="pt-3 pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Date engagement</Label>
                        <Input
                          type="date"
                          className="h-9 text-xs mt-1"
                          value={editedEngagementDate}
                          onChange={(e) => {
                            setEditedEngagementDate(e.target.value);
                            setTimeout(() => autoSave(), 500);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Date suivi</Label>
                        <Input
                          type="date"
                          className="h-9 text-xs mt-1"
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
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{selectedContact.full_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{selectedContact.role}</div>
                      </div>
                      
                      <Select value={editedStatus} onValueChange={(value: ContactStatus) => {
                        setEditedStatus(value);
                        setTimeout(() => autoSave(), 500);
                      }}>
                        <SelectTrigger className="h-8 w-[110px] text-xs">
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

                    <div className="flex gap-2 flex-wrap">
                      {selectedContact.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => window.open(`mailto:${selectedContact.email}`, '_blank')}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      )}
                      {selectedContact.phone && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => window.open(`tel:${selectedContact.phone}`, '_blank')}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Tel
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => window.open(`https://wa.me/${selectedContact.phone.replace(/\s/g, '')}`, '_blank')}
                          >
                            <WhatsAppIcon className="h-3 w-3 mr-1" />
                            WhatsApp
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => window.open(`sms:${selectedContact.phone}`, '_blank')}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            SMS
                          </Button>
                        </>
                      )}
                      {selectedContact.linkedin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleOpenLink(selectedContact.linkedin)}
                        >
                          <Linkedin className="h-3 w-3 mr-1" />
                          LinkedIn
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* BLOC 4 - Actions */}
                <Card>
                  <CardContent className="pt-3 pb-3">
                    <div className="space-y-2">
                      <Select 
                        value={selectedAction?.toString() || ""} 
                        onValueChange={(value) => setSelectedAction(parseInt(value))}
                      >
                        <SelectTrigger className="h-9 text-xs">
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

                      <Button
                        className="w-full h-9 font-semibold text-xs"
                        disabled={!selectedAction}
                        onClick={() => {
                          if (!selectedAction) return;
                          const action = actions.find(a => a.id === selectedAction);
                          if (action) {
                            if (action.type === 'email') {
                              const subject = action.emailSubject || '';
                              const body = action.emailBody || '';
                              window.open(`mailto:${selectedContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                            }
                            setLastAction(action.name);
                            toast.success('Action effectuée !');
                          }
                        }}
                      >
                        Exécuter l'action
                      </Button>

                      {lastAction && (
                        <div className="bg-muted/50 rounded-md p-2">
                          <div className="text-xs font-semibold text-muted-foreground mb-1">Dernière action:</div>
                          <div className="text-xs text-foreground">{lastAction}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* BLOC 5 - Note */}
                <Card>
                  <CardContent className="pt-3 pb-3">
                    <Label className="text-xs text-muted-foreground mb-2 block">Note</Label>
                    <Textarea
                      placeholder="Ajouter une note..."
                      className="min-h-[100px] text-xs"
                      value={editedNote}
                      onChange={(e) => {
                        setEditedNote(e.target.value);
                        setTimeout(() => autoSave(), 500);
                      }}
                    />
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
