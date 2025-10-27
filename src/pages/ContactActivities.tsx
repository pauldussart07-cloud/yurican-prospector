import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { ArrowLeft, Building2, Users, Globe, Linkedin, MapPin, TrendingUp, DollarSign, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { companySummaryService } from '@/services/companySummaryService';
import { Skeleton } from '@/components/ui/skeleton';

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
        .select('id, company_name')
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{lead?.company_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Summary Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résumé de l'entreprise</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSummary ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <p className="text-muted-foreground leading-relaxed">{companySummary}</p>
                )}
              </CardContent>
            </Card>

            {/* Company Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nom</p>
                      <p className="font-medium">{lead?.company_name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">SIRET</p>
                      <p className="font-medium">{lead?.id || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCompanyDetails(false)}
              >
                Fermer
              </Button>
              <Button onClick={() => navigate('/prospects')}>
                Voir dans Prospects
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
