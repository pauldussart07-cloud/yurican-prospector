import { useState, useEffect } from 'react';
import { Phone, Mail, Linkedin, Globe, Building2, ChevronDown, ChevronRight, ChevronUp, Calendar, MessageSquare, ChevronLeft } from 'lucide-react';
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
  const [currentContactIndices, setCurrentContactIndices] = useState<Map<string, number>>(new Map());
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
      companyDepartment: lead.company_department,
      companySiret: lead.company_siret,
      companyAddress: lead.company_address,
      companySector: lead.company_sector,
      signalSummary: lead.signal_summary,
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
            const currentIndex = getCurrentContactIndex(lead.id);
            const displayedContact = lead.contacts[currentIndex];

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
                          <span className="text-muted-foreground truncate line-clamp-2">
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

                  {/* Navigation entre contacts */}
                  {lead.contacts.length > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreviousContact(lead.id, lead.contacts.length)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Précédent
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {currentIndex + 1} / {lead.contacts.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNextContact(lead.id, lead.contacts.length)}
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
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
            <DrawerTitle>Entreprise</DrawerTitle>
            <DrawerDescription>
              {selectedContact && (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold">{selectedContact.fullName}</span>
                    <span className="text-muted-foreground"> - {selectedContact.role}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    {selectedContact.phone && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => window.open(`tel:${selectedContact.phone}`, '_blank')}
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {selectedContact.phone && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => window.open(`sms:${selectedContact.phone}`, '_blank')}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {selectedContact.email && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => window.open(`mailto:${selectedContact.email}`, '_blank')}
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {selectedContact.linkedin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenLink(selectedContact.linkedin)}
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DrawerDescription>
          </DrawerHeader>

          {selectedContact && (() => {
            const contactLead = leadsWithContacts.find(l => 
              l.contacts.some(c => c.id === selectedContact.id)
            );
            
            return (
              <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[70vh]">
                {/* Dates, Statut et Actions */}
                <Card>
                  <CardContent className="pt-4 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Date d'ajout</Label>
                        <div className="text-sm">
                          {contactLead && new Date(contactLead.created_at || '').toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Date de suivi</Label>
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={editedFollowUpDate}
                          onChange={(e) => setEditedFollowUpDate(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Statut</Label>
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
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Action</Label>
                        <Select onValueChange={(value) => handleActionClick(parseInt(value))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Choisir" />
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
                  </CardContent>
                </Card>

                {/* Informations entreprise */}
                {contactLead && (
                  <Card>
                    <CardContent className="pt-4 pb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-sm">{contactLead.companyName}</span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {contactLead.companyWebsite && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleOpenLink(contactLead.companyWebsite)}
                            >
                              <Globe className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {contactLead.companyLinkedin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleOpenLink(contactLead.companyLinkedin)}
                            >
                              <Linkedin className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {contactLead.companyDepartment && (
                          <div>
                            <span className="text-muted-foreground">Département:</span>
                            <div className="font-medium">{contactLead.companyDepartment}</div>
                          </div>
                        )}
                        {contactLead.companySiret && (
                          <div>
                            <span className="text-muted-foreground">SIRET:</span>
                            <div className="font-medium">{contactLead.companySiret}</div>
                          </div>
                        )}
                        {contactLead.companyHeadcount && (
                          <div>
                            <span className="text-muted-foreground">Effectif:</span>
                            <div className="font-medium">{contactLead.companyHeadcount} pers.</div>
                          </div>
                        )}
                        {contactLead.companyCa && (
                          <div>
                            <span className="text-muted-foreground">CA:</span>
                            <div className="font-medium">{(contactLead.companyCa / 1000000).toFixed(1)}M€</div>
                          </div>
                        )}
                      </div>

                      {contactLead.companySector && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Secteur:</span>
                          <div className="font-medium">{contactLead.companySector}</div>
                        </div>
                      )}

                      {contactLead.companyAddress && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Adresse:</span>
                          <div className="font-medium">{contactLead.companyAddress}</div>
                        </div>
                      )}

                      {contactLead.signalSummary && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground mb-1">Synthèse:</div>
                          <div className="text-xs">{contactLead.signalSummary}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Note */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Note</Label>
                      <Textarea
                        value={editedNote}
                        onChange={(e) => setEditedNote(e.target.value)}
                        placeholder="Ajouter une note..."
                        rows={4}
                        className="text-xs mt-1"
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
