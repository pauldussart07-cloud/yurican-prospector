import { useState } from 'react';
import { Phone, Mail, Users as UsersIcon, Building2, MapPin, Briefcase, ExternalLink, Linkedin, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useToast } from '@/hooks/use-toast';
import { mockLeads, mockCompanies, mockContacts, Lead, Contact } from '@/lib/mockData';
import { contactsService, PersonaType } from '@/services/contactsService';

const Leads = () => {
  const { toast } = useToast();
  const [leads] = useState<Lead[]>(mockLeads);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [generatingContacts, setGeneratingContacts] = useState(false);
  
  // Persona selector state
  const [selectedPersonas, setSelectedPersonas] = useState<PersonaType[]>([]);
  const [contactCount, setContactCount] = useState(3);


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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leads</h1>
        <div className="text-sm text-muted-foreground">
          {leads.length} lead{leads.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste des leads */}
      <div className="space-y-3">
        {leads.map((lead) => {
          const company = mockCompanies.find(c => c.id === lead.companyId);
          const leadContacts = contacts.filter(c => c.companyId === lead.companyId);

          if (!company) return null;

          return (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <Checkbox />

                  {/* Bloc 1 : Logo entreprise */}
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Bloc 2 : Raison sociale, département, secteur */}
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
                  </div>

                  {/* Bloc 4 : CA et Effectif */}
                  <div className="flex-shrink-0 w-32">
                    <div className="flex items-center gap-2 mb-1">
                      {getRevenueIcon(company.ca)}
                      <span className="text-xs font-medium">
                        {(company.ca / 1000000).toFixed(1)}M€
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getHeadcountIcon(company.headcount)}
                      <span className="text-xs font-medium">
                        {company.headcount} emp.
                      </span>
                    </div>
                  </div>

                  {/* Bloc 5 : Liens */}
                  <div className="flex-shrink-0 flex flex-col gap-1">
                    <Button size="sm" variant="ghost" asChild className="h-7 justify-start">
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                        <ExternalLink className="h-3 w-3" />
                        <span className="text-xs">Site web</span>
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" asChild className="h-7 justify-start">
                      <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                        <Linkedin className="h-3 w-3" />
                        <span className="text-xs">LinkedIn</span>
                      </a>
                    </Button>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Contacts avec HoverCard */}
                  <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          setSelectedLead(lead.id);
                          setShowPersonaDialog(true);
                        }}
                      >
                        <UsersIcon className="h-4 w-4" />
                        {leadContacts.length} contact{leadContacts.length > 1 ? 's' : ''}
                      </Button>
                    </HoverCardTrigger>
                    {leadContacts.length > 0 && (
                      <HoverCardContent className="w-96 p-4" align="end">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Contacts</h4>
                          {leadContacts.map((contact) => (
                            <div key={contact.id} className="border-b pb-3 last:border-0 last:pb-0">
                              <p className="font-medium text-sm">{contact.fullName}</p>
                              <p className="text-xs text-muted-foreground">{contact.role}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">{contact.seniority}</Badge>
                                <Badge variant="secondary" className="text-xs">{contact.domain}</Badge>
                              </div>
                              <div className="flex flex-col gap-1 mt-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span>{contact.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{contact.phone}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </HoverCardContent>
                    )}
                  </HoverCard>

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
