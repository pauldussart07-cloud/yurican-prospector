import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { ArrowLeft, Building2, Users, Globe, Linkedin, MapPin, TrendingUp, Briefcase, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Activity {
  id: string;
  activity_type: 'note' | 'action' | 'status_change' | 'meeting';
  activity_description: string;
  previous_value?: string;
  new_value?: string;
  created_at: string;
  contact_name?: string;
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

interface Contact {
  id: string;
  full_name: string;
  role: string;
}

export default function CompanyActivities() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [leadId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load lead/company info
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('id, company_name, company_sector, company_department, company_ca, company_headcount, company_website, company_linkedin, company_address, company_siret, company_naf')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single();

      if (leadError) throw leadError;
      setLead(leadData);

      // Load all contacts from this company
      const { data: contactsData, error: contactsError } = await supabase
        .from('lead_contacts')
        .select('id, full_name, role')
        .eq('lead_id', leadId)
        .eq('user_id', user.id);

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);

      // Load all activities from all contacts of this company
      if (contactsData && contactsData.length > 0) {
        const contactIds = contactsData.map(c => c.id);
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('contact_activities')
          .select('*')
          .in('contact_id', contactIds)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (activitiesError) throw activitiesError;

        // Enrich activities with contact names
        const enrichedActivities = activitiesData?.map(activity => {
          const contact = contactsData.find(c => c.id === activity.contact_id);
          return {
            id: activity.id,
            activity_type: activity.activity_type as 'note' | 'action' | 'status_change' | 'meeting',
            activity_description: `${contact?.full_name} - ${activity.activity_description}`,
            previous_value: activity.previous_value || undefined,
            new_value: activity.new_value || undefined,
            created_at: activity.created_at,
            contact_name: contact?.full_name
          };
        }) || [];

        setActivities(enrichedActivities);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContact = (contactId: string) => {
    navigate(`/contact-activities/${contactId}`);
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
          onClick={() => navigate('/prospects')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux prospects
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Activités de {lead?.company_name}
            </h1>
            <p className="text-muted-foreground">
              Historique complet des activités de tous les contacts
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
              {activities.length > 0 ? (
                <ActivityTimeline activities={activities} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune activité enregistrée pour cette entreprise
                </div>
              )}
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
                Informations entreprise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-lg">{lead?.company_name}</p>
                </div>
                
                {lead?.company_sector && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    <span>{lead.company_sector}</span>
                  </div>
                )}
                
                {lead?.company_department && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{lead.company_department}</span>
                  </div>
                )}

                {lead?.company_naf && (
                  <Badge variant="secondary" className="text-xs">
                    {lead.company_naf}
                  </Badge>
                )}

                <div className="pt-3 border-t space-y-2">
                  {lead?.company_ca && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        CA
                      </span>
                      <span className="font-semibold">{(lead.company_ca / 1000000).toFixed(1)}M€</span>
                    </div>
                  )}
                  {lead?.company_headcount && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Effectif
                      </span>
                      <span className="font-semibold">{lead.company_headcount} emp.</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t space-y-2">
                  {lead?.company_website && (
                    <a
                      href={lead.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      Site web
                    </a>
                  )}
                  {lead?.company_linkedin && (
                    <a
                      href={lead.company_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Linkedin className="h-3 w-3" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts list */}
          {contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Contacts ({contacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleViewContact(contact.id)}
                      className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <p className="font-medium text-sm">{contact.full_name}</p>
                      <p className="text-xs text-muted-foreground">{contact.role}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
