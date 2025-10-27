import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { ArrowLeft, Building2, Users, Globe, Linkedin, MapPin, TrendingUp, DollarSign, Package, ExternalLink, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { companySummaryService } from '@/services/companySummaryService';
import { Badge } from '@/components/ui/badge';

interface Activity {
  id: string;
  activity_type: 'note' | 'action' | 'status_change' | 'meeting';
  activity_description: string;
  previous_value?: string;
  new_value?: string;
  created_at: string;
}

interface Contact {
  id: string;
  full_name: string;
  role: string;
  lead_id: string;
}

interface Lead {
  id: string;
  company_name: string;
  company_sector?: string;
  company_department?: string;
  company_ca?: number;
  company_headcount?: number;
  company_website?: string;
  company_linkedin?: string;
  company_address?: string;
  company_siret?: string;
  company_naf?: string;
}

interface OtherContact {
  id: string;
  full_name: string;
  role: string;
}

export default function ContactActivities() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [otherContacts, setOtherContacts] = useState<OtherContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [companySummary, setCompanySummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    loadData();
  }, [contactId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load contact info
      const { data: contactData, error: contactError } = await supabase
        .from('lead_contacts')
        .select('id, full_name, role, lead_id')
        .eq('id', contactId)
        .eq('user_id', user.id)
        .single();

      if (contactError) throw contactError;
      setContact(contactData);

      // Load lead/company info
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('id, company_name, company_sector, company_department, company_ca, company_headcount, company_website, company_linkedin, company_address, company_siret, company_naf')
        .eq('id', contactData.lead_id)
        .eq('user_id', user.id)
        .single();

      if (leadError) throw leadError;
      setLead(leadData);

      // Load other contacts from the same company
      const { data: otherContactsData, error: otherContactsError } = await supabase
        .from('lead_contacts')
        .select('id, full_name, role')
        .eq('lead_id', contactData.lead_id)
        .eq('user_id', user.id)
        .neq('id', contactId);

      if (otherContactsError) throw otherContactsError;
      setOtherContacts(otherContactsData || []);

      // Load all activities for this contact
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('contact_activities')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;
      setActivities((activitiesData || []) as Activity[]);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCompany = async () => {
    if (!lead) return;
    
    setShowCompanyDetails(true);
    setLoadingSummary(true);
    
    try {
      const summary = await companySummaryService.summarize({
        id: lead.id,
        name: lead.company_name,
        siret: lead.id,
        sector: '',
        department: '',
        ca: 0,
        headcount: 0,
        website: '',
        linkedin: '',
        naf: '',
        address: '',
        logoUrl: '',
        isHidden: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setCompanySummary(summary);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleViewOtherContact = (otherContactId: string) => {
    navigate(`/contact-activities/${otherContactId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Activités de {contact?.full_name}
            </h1>
            <p className="text-muted-foreground">
              {contact?.role} • {lead?.company_name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Historique complet des activités</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={activities} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Entreprise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{lead?.company_name}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleViewCompany}
                >
                  Voir l'entreprise
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Other contacts */}
          {otherContacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Autres contacts ({otherContacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {otherContacts.map((otherContact) => (
                    <button
                      key={otherContact.id}
                      onClick={() => handleViewOtherContact(otherContact.id)}
                      className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <p className="font-medium text-sm">{otherContact.full_name}</p>
                      <p className="text-xs text-muted-foreground">{otherContact.role}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Company Details Dialog */}
      <Dialog open={showCompanyDetails} onOpenChange={setShowCompanyDetails}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{lead?.company_name}</DialogTitle>
          </DialogHeader>
          
          {lead && (
            <div className="grid grid-cols-12 gap-6">
              {/* Colonne gauche : Carte entreprise */}
              <div className="col-span-3">
                <Card className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      {/* Logo */}
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center mx-auto">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      
                      {/* Nom et localisation */}
                      <div className="text-center space-y-2">
                        <h3 className="text-base font-semibold">
                          {lead.company_name}
                        </h3>
                        <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
                          {lead.company_department && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              <span>{lead.company_department}</span>
                            </div>
                          )}
                          {lead.company_sector && (
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="h-3 w-3" />
                              <span>{lead.company_sector}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      {lead.company_naf && (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          <Badge className="text-xs">{lead.company_naf}</Badge>
                        </div>
                      )}

                      {/* KPI rapides */}
                      {(lead.company_ca || lead.company_headcount) && (
                        <div className="pt-3 border-t space-y-2">
                          {lead.company_ca && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                CA
                              </span>
                              <span className="font-semibold">{(lead.company_ca / 1000000).toFixed(1)}M€</span>
                            </div>
                          )}
                          {lead.company_headcount && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Effectif
                              </span>
                              <span className="font-semibold">{lead.company_headcount} emp.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Colonne centrale : KPI en 2 colonnes */}
              <div className="col-span-5">
                <h3 className="text-lg font-semibold mb-4">Informations détaillées</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {lead.company_address && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Adresse</span>
                      <p className="text-sm font-medium">{lead.company_address}</p>
                    </div>
                  )}
                  
                  {lead.company_siret && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">SIRET</span>
                      <p className="text-sm font-medium">{lead.company_siret}</p>
                    </div>
                  )}
                  
                  {lead.company_naf && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Code NAF</span>
                      <p className="text-sm font-medium">{lead.company_naf}</p>
                    </div>
                  )}
                  
                  {lead.company_sector && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Secteur</span>
                      <p className="text-sm font-medium">{lead.company_sector}</p>
                    </div>
                  )}
                  
                  {lead.company_ca && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Chiffre d'affaires</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-medium">{(lead.company_ca / 1000000).toFixed(1)}M€</p>
                      </div>
                    </div>
                  )}
                  
                  {lead.company_headcount && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Effectif</span>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium">{lead.company_headcount} employés</p>
                      </div>
                    </div>
                  )}
                  
                  {lead.company_department && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Département</span>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <p className="text-sm font-medium">{lead.company_department}</p>
                      </div>
                    </div>
                  )}
                  
                  {lead.company_sector && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Secteur d'activité</span>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <p className="text-sm font-medium">{lead.company_sector}</p>
                      </div>
                    </div>
                  )}
                  
                  {lead.company_website && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Site web</span>
                      <a 
                        href={lead.company_website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visiter le site →
                      </a>
                    </div>
                  )}
                  
                  {lead.company_linkedin && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">LinkedIn</span>
                      <a 
                        href={lead.company_linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <Linkedin className="h-3 w-3" />
                        Voir le profil →
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne droite : Synthèse et actions */}
              <div className="col-span-4">
                <h3 className="text-lg font-semibold mb-4">Synthèse</h3>
                <div className="bg-muted/20 rounded-lg p-4 border border-border mb-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {loadingSummary ? 'Génération de la synthèse en cours...' : companySummary || 'Aucune synthèse disponible'}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="space-y-3">
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/prospects')}
                  >
                    Voir dans Prospects
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowCompanyDetails(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
