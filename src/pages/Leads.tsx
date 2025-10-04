import { useState } from 'react';
import { ChevronDown, ChevronRight, Phone, Mail, Users as UsersIcon, Building2, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { mockLeads, mockCompanies, mockContacts, Lead, Contact } from '@/lib/mockData';
import { contactsService, PersonaType } from '@/services/contactsService';

const Leads = () => {
  const { toast } = useToast();
  const [leads] = useState<Lead[]>(mockLeads);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [generatingContacts, setGeneratingContacts] = useState(false);
  
  // Persona selector state
  const [selectedPersonas, setSelectedPersonas] = useState<PersonaType[]>([]);
  const [contactCount, setContactCount] = useState(3);

  const toggleExpand = (leadId: string) => {
    const newExpanded = new Set(expandedLeads);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    setExpandedLeads(newExpanded);
  };

  const handleGenerateContacts = async () => {
    if (!selectedLead || selectedPersonas.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins un persona.',
        variant: 'destructive',
      });
      return;
    }

    const lead = leads.find(l => l.id === selectedLead);
    const company = mockCompanies.find(c => c.id === lead?.companyId);
    
    if (!company) return;

    setGeneratingContacts(true);
    
    try {
      const newContacts = await contactsService.generateContacts({
        companyId: company.id,
        companyName: company.name,
        personas: selectedPersonas,
        count: contactCount,
      });

      setContacts([...contacts, ...newContacts]);
      
      toast({
        title: 'Contacts générés',
        description: `${newContacts.length} contact${newContacts.length > 1 ? 's ont' : ' a'} été ajouté${newContacts.length > 1 ? 's' : ''}.`,
      });

      setShowPersonaDialog(false);
      setSelectedPersonas([]);
      setContactCount(3);
      
      // Auto-expand the lead to show new contacts
      setExpandedLeads(new Set([...expandedLeads, selectedLead]));
    } catch (error) {
      console.error('Error generating contacts:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération des contacts.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingContacts(false);
    }
  };

  const handlePersonaToggle = (persona: PersonaType) => {
    setSelectedPersonas(prev =>
      prev.includes(persona)
        ? prev.filter(p => p !== persona)
        : [...prev, persona]
    );
  };

  const personas: PersonaType[] = [
    'Décisionnaire Commercial',
    'Décisionnaire Marketing',
    'Direction Générale',
    'Opérations',
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leads</h1>
        <div className="text-sm text-muted-foreground">
          {leads.length} lead{leads.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste des leads */}
      <div className="space-y-4">
        {leads.map((lead) => {
          const company = mockCompanies.find(c => c.id === lead.companyId);
          const leadContacts = contacts.filter(c => c.companyId === lead.companyId);
          const isExpanded = expandedLeads.has(lead.id);

          if (!company) return null;

          return (
            <Card key={lead.id} className="overflow-hidden">
              <CardContent className="p-6">
                {/* Lead header */}
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleExpand(lead.id)}
                    className="mt-1 hover:bg-muted rounded p-1 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>

                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold">{company.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {company.department}
                      </Badge>
                      <Badge variant="outline">{company.sector}</Badge>
                      <Badge>{company.siret}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLead(lead.id);
                        setShowPersonaDialog(true);
                      }}
                    >
                      <UsersIcon className="h-4 w-4 mr-2" />
                      {leadContacts.length} contact{leadContacts.length > 1 ? 's' : ''}
                    </Button>

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
                </div>

                {/* Contacts dépliés */}
                {isExpanded && leadContacts.length > 0 && (
                  <div className="mt-6 space-y-3 border-t pt-6">
                    {leadContacts.map((contact) => (
                      <Card key={contact.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{contact.fullName}</h4>
                              <p className="text-sm text-muted-foreground">{contact.role}</p>
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary">{contact.seniority}</Badge>
                                <Badge variant="secondary">{contact.domain}</Badge>
                              </div>

                              <div className="flex gap-4 mt-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="blur-sm hover:blur-none transition-all cursor-pointer">
                                    {contact.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="blur-sm hover:blur-none transition-all cursor-pointer">
                                    {contact.phone}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Phone className="h-4 w-4 mr-1" />
                                Appeler
                              </Button>
                              <Button size="sm" variant="outline">
                                <Mail className="h-4 w-4 mr-1" />
                                Email
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {isExpanded && leadContacts.length === 0 && (
                  <div className="mt-6 text-center py-8 border-t text-muted-foreground">
                    <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun contact pour cette entreprise</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setSelectedLead(lead.id);
                        setShowPersonaDialog(true);
                      }}
                    >
                      Générer des contacts
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog pour sélectionner les personas */}
      <Dialog open={showPersonaDialog} onOpenChange={setShowPersonaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Générer des contacts</DialogTitle>
            <DialogDescription>
              Sélectionnez les types de contacts que vous souhaitez générer pour cette entreprise.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Personas</Label>
              {personas.map((persona) => (
                <div key={persona} className="flex items-center space-x-2">
                  <Checkbox
                    id={persona}
                    checked={selectedPersonas.includes(persona)}
                    onCheckedChange={() => handlePersonaToggle(persona)}
                  />
                  <label
                    htmlFor={persona}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {persona}
                  </label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">Nombre de contacts</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={10}
                value={contactCount}
                onChange={(e) => setContactCount(parseInt(e.target.value) || 1)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleGenerateContacts}
              disabled={generatingContacts || selectedPersonas.length === 0}
            >
              {generatingContacts ? 'Génération...' : 'Générer les contacts'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;
