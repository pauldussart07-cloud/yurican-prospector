import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityTimeline } from './ActivityTimeline';
import { Loader2 } from 'lucide-react';

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
}

export const CompanyActivityTimeline = ({ companyId }: CompanyActivityTimelineProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

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
          setLoading(false);
          return;
        }

        // Récupérer toutes les activités de tous les contacts
        const contactIds = contacts.map(c => c.id);
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('contact_activities')
          .select('*')
          .in('contact_id', contactIds)
          .order('created_at', { ascending: false });

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
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchCompanyActivities();
    }
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <ActivityTimeline activities={activities} />;
};
