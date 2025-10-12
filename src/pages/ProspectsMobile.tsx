import { useState, useEffect } from 'react';
import { Phone, Mail, Linkedin, Globe, Building2, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
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
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());

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
    }));

    setLeads(transformedLeads);
    setContacts(transformedContacts);
    setLoading(false);
  };

  const handleContactClick = (contact: any) => {
    setSelectedContact(contact);
    setIsDrawerOpen(true);
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
                  <div className="space-y-3 pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{lead.companyName}</span>
                    </div>
                    
                    {/* KPI entreprise */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {lead.companyHeadcount && (
                        <div className="bg-muted/50 rounded p-2">
                          <div className="text-xs text-muted-foreground">Effectif</div>
                          <div className="font-semibold">{lead.companyHeadcount} pers.</div>
                        </div>
                      )}
                      {lead.companyCa && (
                        <div className="bg-muted/50 rounded p-2">
                          <div className="text-xs text-muted-foreground">CA</div>
                          <div className="font-semibold">{(lead.companyCa / 1000000).toFixed(1)}M€</div>
                        </div>
                      )}
                    </div>

                    {/* Résumé */}
                    {lead.signalSummary && (
                      <div className="text-xs text-muted-foreground bg-accent/30 rounded p-2">
                        {lead.signalSummary}
                      </div>
                    )}

                    {/* Actions liens */}
                    <div className="flex gap-2">
                      {lead.companyWebsite && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenLink(lead.companyWebsite)}
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                      )}
                      {lead.companyLinkedin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenLink(lead.companyLinkedin)}
                        >
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Contact principal */}
                  <div
                    className="cursor-pointer hover:bg-accent/50 transition-colors rounded-lg p-3 -mx-3"
                    onClick={() => handleContactClick(primaryContact)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">{primaryContact.fullName}</div>
                        <div className="text-sm text-muted-foreground">{primaryContact.role}</div>
                        <Badge variant={getStatusBadgeVariant(primaryContact.status)} className="mt-2">
                          {primaryContact.status}
                        </Badge>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
                          <div
                            key={contact.id}
                            className="cursor-pointer hover:bg-accent/50 transition-colors rounded-lg p-3 border"
                            onClick={() => handleContactClick(contact)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold">{contact.fullName}</div>
                                <div className="text-sm text-muted-foreground">{contact.role}</div>
                                <Badge variant={getStatusBadgeVariant(contact.status)} className="mt-2">
                                  {contact.status}
                                </Badge>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
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

          {selectedContact && (
            <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Informations du contact */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Nom</div>
                    <div className="font-semibold">{selectedContact.fullName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Rôle</div>
                    <div>{selectedContact.role}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Statut</div>
                    <Badge variant={getStatusBadgeVariant(selectedContact.status)}>
                      {selectedContact.status}
                    </Badge>
                  </div>
                  {selectedContact.note && (
                    <div>
                      <div className="text-sm text-muted-foreground">Note</div>
                      <div className="text-sm">{selectedContact.note}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <div className="text-sm font-medium mb-3">Actions rapides</div>
                  
                  {selectedContact.email && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(`mailto:${selectedContact.email}`, '_blank')}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedContact.email}
                    </Button>
                  )}

                  {selectedContact.phone && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(`tel:${selectedContact.phone}`, '_blank')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedContact.phone}
                    </Button>
                  )}

                  {selectedContact.linkedin && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleOpenLink(selectedContact.linkedin)}
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn du contact
                    </Button>
                  )}

                  {(() => {
                    const contactLead = leadsWithContacts.find(l => 
                      l.contacts.some(c => c.id === selectedContact.id)
                    );
                    return (
                      <>
                        {contactLead?.companyWebsite && (
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => handleOpenLink(contactLead.companyWebsite)}
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Site web de l'entreprise
                          </Button>
                        )}

                        {contactLead?.companyLinkedin && (
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => handleOpenLink(contactLead.companyLinkedin)}
                          >
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn de l'entreprise
                          </Button>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ProspectsMobile;
