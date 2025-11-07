import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ActivityTimeline } from './ActivityTimeline';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Activity {
  id: string;
  activity_type: 'note' | 'action' | 'status_change' | 'meeting';
  activity_description: string;
  previous_value?: string;
  new_value?: string;
  created_at: string;
  contact_name?: string;
}

interface CompanyActivityTimelineProps {
  companyId: string;
  limit?: number;
}

export const CompanyActivityTimeline = ({ companyId, limit = 2 }: CompanyActivityTimelineProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyActivities = async () => {
      try {
        setLoading(true);
        
        // Récupérer tous les contacts de l'entreprise
        const { data: contacts, error: contactsError } = await supabase
          .from('lead_contacts')
          .select('id, full_name')
          .eq('lead_id', companyId);

        if (contactsError) throw contactsError;

        if (!contacts || contacts.length === 0) {
          setActivities([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        // Récupérer les activités limitées de tous les contacts
        const contactIds = contacts.map(c => c.id);
        
        // Get total count
        const { count } = await supabase
          .from('contact_activities')
          .select('*', { count: 'exact', head: true })
          .in('contact_id', contactIds);
        
        setTotalCount(count || 0);

        // Get limited activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('contact_activities')
          .select('*')
          .in('contact_id', contactIds)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (activitiesError) throw activitiesError;

        // Enrichir les activités avec le nom du contact
        const enrichedActivities = activitiesData?.map(activity => {
          const contact = contacts.find(c => c.id === activity.contact_id);
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
      } catch (error) {
        console.error('Erreur lors de la récupération des activités:', error);
        setActivities([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchCompanyActivities();
    }
  }, [companyId, limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Aucune activité enregistrée
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ActivityTimeline activities={activities} />
      
      {totalCount > limit && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => navigate(`/company-activities/${companyId}`)}
        >
          Voir toutes les activités ({totalCount})
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
};
