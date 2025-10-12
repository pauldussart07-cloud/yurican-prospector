import { useState, useEffect } from 'react';
import { Phone, Mail, Linkedin, Globe, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { mockCompanies } from '@/lib/mockData';
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
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    
    if (transformedLeads.length > 0) {
      setSelectedLeadId(transformedLeads[0].id);
    }
    
    setLoading(false);
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const leadContacts = contacts.filter(c => c.leadId === selectedLeadId);

  const handleContactClick = (contact: any) => {
    setSelectedContact(contact);
    setIsDrawerOpen(true);
  };

  const handleOpenLink = (url: string) => {
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    }
  };

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

      {/* Sélecteur d'entreprise */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Entreprise</label>
            <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une entreprise" />
              </SelectTrigger>
              <SelectContent>
                {leads.map(lead => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLead && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{selectedLead.companyName}</span>
              </div>
              <div className="flex gap-2">
                {selectedLead.companyWebsite && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenLink(selectedLead.companyWebsite)}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                )}
                {selectedLead.companyLinkedin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenLink(selectedLead.companyLinkedin)}
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des contacts */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Contacts ({leadContacts.length})</h2>
        {leadContacts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Aucun contact pour cette entreprise
              </p>
            </CardContent>
          </Card>
        ) : (
          leadContacts.map(contact => (
            <Card
              key={contact.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleContactClick(contact)}
            >
              <CardContent className="pt-6">
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
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Drawer fiche contact */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Fiche Contact</DrawerTitle>
            <DrawerDescription>
              {selectedContact && selectedLead && `${selectedContact.fullName} - ${selectedLead.companyName}`}
            </DrawerDescription>
          </DrawerHeader>

          {selectedContact && selectedLead && (
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

                  {selectedLead.companyWebsite && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleOpenLink(selectedLead.companyWebsite)}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Site web de l'entreprise
                    </Button>
                  )}

                  {selectedLead.companyLinkedin && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleOpenLink(selectedLead.companyLinkedin)}
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn de l'entreprise
                    </Button>
                  )}
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
