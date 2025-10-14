import { useState, useEffect } from 'react';
import { Search, Building2, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

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
  const [activeTab, setActiveTab] = useState('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'Tous'>('Tous');
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
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

    setLeads(leadsData || []);
    setContacts(contactsData || []);
    setLoading(false);
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
              <Card key={lead.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
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
                <Card key={contact.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
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
    </div>
  );
};

export default ProspectsMobile;
