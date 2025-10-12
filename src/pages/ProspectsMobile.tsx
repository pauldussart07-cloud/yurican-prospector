import { useState, useEffect } from 'react';
import { Phone, Mail, Linkedin, Globe, Building2, ChevronDown, ChevronRight, ChevronUp, Calendar } from 'lucide-react';
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

const ProspectsMobile = () => {
  const { actions } = useActions();
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [editedStatus, setEditedStatus] = useState<ContactStatus>('Nouveau');
  const [editedNote, setEditedNote] = useState('');
  const [editedFollowUpDate, setEditedFollowUpDate] = useState('');

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
      signalSummary: lead.signal_summary,
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
    setIsDrawerOpen(true);
  };

  const handleSaveContact = async () => {
    if (!selectedContact) return;

    const { error } = await supabase
      .from('lead_contacts')
      .update({
        status: editedStatus,
        note: editedNote,
        follow_up_date: editedFollowUpDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedContact.id);

    if (error) {
      toast.error('Erreur lors de la sauvegarde');
      return;
    }

    toast.success('Contact mis à jour');
    setIsDrawerOpen(false);
    loadData();
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

  const toggleLeadExpansion = (leadId: string) => {
    const newExpanded = new Set(expandedLeads);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    setExpandedLeads(newExpanded);
  };

  // Grouper les leads avec leurs contacts
  const leadsWithContacts = leads.map(lead => ({
    ...lead,
    contacts: contacts.filter(c => c.leadId === lead.id)
  })).filter(lead => lead.contacts.length > 0);

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
      <h1 className="text-2xl font-bold">Prospects Mobile</h1>

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
            const isExpanded = expandedLeads.has(lead.id);
            const primaryContact = lead.contacts[0];
            const otherContacts = lead.contacts.slice(1);

            return (
              <Card key={lead.id}>
                <CardContent className="pt-6 space-y-3">
                  {/* En-tête entreprise */}
                  <div className="pb-3 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{lead.companyName}</span>
                    </div>
                    
                    {/* Ligne unique avec KPI, résumé et liens */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 text-xs overflow-hidden">
                        {lead.companyHeadcount && (
                          <span className="whitespace-nowrap bg-muted/50 rounded px-2 py-1">
                            <span className="font-semibold">{lead.companyHeadcount}</span> pers.
                          </span>
                        )}
                        {lead.companyCa && (
                          <span className="whitespace-nowrap bg-muted/50 rounded px-2 py-1">
                            <span className="font-semibold">{(lead.companyCa / 1000000).toFixed(1)}M€</span>
                          </span>
                        )}
                        {lead.signalSummary && (
                          <span className="text-muted-foreground truncate">
                            {lead.signalSummary}
                          </span>
                        )}
                      </div>
                      
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

                  {/* Contact principal */}
                  <div className="flex items-center gap-2 py-2">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleContactClick(primaryContact)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{primaryContact.fullName}</span>
                        <span className="text-xs text-muted-foreground truncate">{primaryContact.role}</span>
                        <Badge variant={getStatusBadgeVariant(primaryContact.status)} className="text-xs">
                          {primaryContact.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 flex-shrink-0">
                      {primaryContact.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`mailto:${primaryContact.email}`, '_blank');
                          }}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      {primaryContact.phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${primaryContact.phone}`, '_blank');
                          }}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      {primaryContact.linkedin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLink(primaryContact.linkedin);
                          }}
                        >
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleContactClick(primaryContact)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Bouton pour voir les autres contacts */}
                  {otherContacts.length > 0 && (
                    <Collapsible open={isExpanded} onOpenChange={() => toggleLeadExpansion(lead.id)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full">
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Masquer les autres contacts ({otherContacts.length})
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Voir les autres contacts ({otherContacts.length})
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 mt-2">
                        {otherContacts.map(contact => (
                          <div key={contact.id} className="flex items-center gap-2 py-2 border rounded-lg px-3">
                            <div 
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => handleContactClick(contact)}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm truncate">{contact.fullName}</span>
                                <span className="text-xs text-muted-foreground truncate">{contact.role}</span>
                                <Badge variant={getStatusBadgeVariant(contact.status)} className="text-xs">
                                  {contact.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex gap-1 flex-shrink-0">
                              {contact.email && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`mailto:${contact.email}`, '_blank');
                                  }}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              {contact.phone && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`tel:${contact.phone}`, '_blank');
                                  }}
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                              )}
                              {contact.linkedin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenLink(contact.linkedin);
                                  }}
                                >
                                  <Linkedin className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleContactClick(contact)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Drawer fiche contact */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Fiche Contact</DrawerTitle>
            <DrawerDescription>
              {selectedContact && (
                <>
                  {selectedContact.fullName} - {
                    leadsWithContacts.find(l => 
                      l.contacts.some(c => c.id === selectedContact.id)
                    )?.companyName
                  }
                </>
              )}
            </DrawerDescription>
          </DrawerHeader>

          {selectedContact && (() => {
            const contactLead = leadsWithContacts.find(l => 
              l.contacts.some(c => c.id === selectedContact.id)
            );
            
            return (
              <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[70vh]">
                {/* Informations entreprise */}
                {contactLead && (
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">{contactLead.companyName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 text-xs overflow-hidden">
                          {contactLead.companyHeadcount && (
                            <span className="whitespace-nowrap bg-muted/50 rounded px-2 py-1">
                              <span className="font-semibold">{contactLead.companyHeadcount}</span> pers.
                            </span>
                          )}
                          {contactLead.companyCa && (
                            <span className="whitespace-nowrap bg-muted/50 rounded px-2 py-1">
                              <span className="font-semibold">{(contactLead.companyCa / 1000000).toFixed(1)}M€</span>
                            </span>
                          )}
                          {contactLead.signalSummary && (
                            <span className="text-muted-foreground truncate">
                              {contactLead.signalSummary}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-1 flex-shrink-0">
                          {contactLead.companyWebsite && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenLink(contactLead.companyWebsite)}
                            >
                              <Globe className="h-4 w-4" />
                            </Button>
                          )}
                          {contactLead.companyLinkedin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenLink(contactLead.companyLinkedin)}
                            >
                              <Linkedin className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Contact - ligne unique */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{selectedContact.fullName}</div>
                        <div className="text-xs text-muted-foreground truncate">{selectedContact.role}</div>
                      </div>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        {selectedContact.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(`sms:${selectedContact.phone}`, '_blank')}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {selectedContact.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(`tel:${selectedContact.phone}`, '_blank')}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        {selectedContact.linkedin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenLink(selectedContact.linkedin)}
                          >
                            <Linkedin className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1">
                        <Select value={editedStatus} onValueChange={(value: ContactStatus) => setEditedStatus(value)}>
                          <SelectTrigger className="h-8 text-xs">
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
                      
                      <div className="flex-1">
                        <Select onValueChange={(value) => handleActionClick(parseInt(value))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Action" />
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
                    </div>

                    <div className="space-y-2">
                      <Input
                        type="date"
                        className="h-8 text-xs"
                        value={editedFollowUpDate}
                        onChange={(e) => setEditedFollowUpDate(e.target.value)}
                        placeholder="Date de suivi"
                      />
                      
                      <Textarea
                        value={editedNote}
                        onChange={(e) => setEditedNote(e.target.value)}
                        placeholder="Note..."
                        rows={2}
                        className="text-xs"
                      />
                    </div>

                    <Button onClick={handleSaveContact} size="sm" className="w-full mt-3">
                      Sauvegarder
                    </Button>
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
