import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fr } from 'date-fns/locale';
import { format, isSameDay, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { CalendarIcon, Building2, User, Clock } from 'lucide-react';

interface Meeting {
  id: string;
  follow_up_date: string;
  full_name: string;
  lead_id: string;
  company_name: string;
  status: string;
  note: string | null;
}

type ViewMode = 'month' | 'week' | 'day';

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, [selectedDate]);

  const fetchMeetings = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Récupérer les RDV du mois
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const { data: contactsData } = await supabase
      .from('lead_contacts')
      .select('id, follow_up_date, full_name, lead_id, status, note')
      .eq('user_id', user.id)
      .gte('follow_up_date', monthStart.toISOString().split('T')[0])
      .lte('follow_up_date', monthEnd.toISOString().split('T')[0])
      .not('follow_up_date', 'is', null)
      .order('follow_up_date', { ascending: true });

    if (contactsData) {
      // Récupérer les noms des entreprises
      const leadIds = [...new Set(contactsData.map(c => c.lead_id))];
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, company_name')
        .in('id', leadIds);

      const leadsMap = new Map(leadsData?.map(l => [l.id, l.company_name]) || []);

      const meetingsWithCompanies: Meeting[] = contactsData.map(contact => ({
        ...contact,
        company_name: leadsMap.get(contact.lead_id) || 'Entreprise inconnue'
      }));

      setMeetings(meetingsWithCompanies);
    }

    setLoading(false);
  };

  const meetingsOnSelectedDate = meetings.filter(m =>
    isSameDay(parseISO(m.follow_up_date), selectedDate)
  );

  const datesWithMeetings = meetings.map(m => parseISO(m.follow_up_date));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nouveau': return 'bg-yellow-500';
      case 'Engagé': return 'bg-blue-500';
      case 'Discussion': return 'bg-purple-500';
      case 'RDV': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-8 w-8" />
          Agenda
        </h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            onClick={() => setViewMode('month')}
          >
            Mois
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            onClick={() => setViewMode('week')}
          >
            Semaine
          </Button>
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            onClick={() => setViewMode('day')}
          >
            Jour
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendrier */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {format(selectedDate, 'MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={fr}
              className="pointer-events-auto w-full"
              modifiers={{
                meeting: datesWithMeetings,
              }}
              modifiersStyles={{
                meeting: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  color: 'hsl(var(--primary))',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* RDV du jour sélectionné */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              RDV du {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : meetingsOnSelectedDate.length === 0 ? (
              <p className="text-muted-foreground">Aucun RDV ce jour</p>
            ) : (
              <div className="space-y-4">
                {meetingsOnSelectedDate.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(parseISO(meeting.follow_up_date), 'HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <Badge className={getStatusColor(meeting.status)}>
                        {meeting.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{meeting.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{meeting.full_name}</span>
                    </div>
                    {meeting.note && (
                      <p className="text-sm text-muted-foreground mt-2 pl-6">
                        {meeting.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Liste de tous les RDV à venir */}
      <Card>
        <CardHeader>
          <CardTitle>Prochains rendez-vous</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : meetings.length === 0 ? (
            <p className="text-muted-foreground">Aucun RDV programmé ce mois</p>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold">
                        {format(parseISO(meeting.follow_up_date), 'd')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(meeting.follow_up_date), 'MMM', { locale: fr })}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">{meeting.company_name}</div>
                      <div className="text-sm text-muted-foreground">{meeting.full_name}</div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Agenda;
