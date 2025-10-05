import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fr } from 'date-fns/locale';
import { format, isSameDay, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { CalendarIcon, Building2, User, Clock, Mail, Phone, Linkedin, MapPin, Globe } from 'lucide-react';

interface Meeting {
  id: string;
  follow_up_date: string;
  full_name: string;
  lead_id: string;
  company_name: string;
  status: string;
  note: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  role: string | null;
}

interface ContactDetails extends Meeting {
  company_address: string | null;
  company_website: string | null;
  company_linkedin: string | null;
  company_sector: string | null;
  company_headcount: number | null;
}

type ViewMode = 'month' | 'week' | 'day';

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ContactDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      .select('id, follow_up_date, full_name, lead_id, status, note, email, phone, linkedin, role')
      .eq('user_id', user.id)
      .gte('follow_up_date', monthStart.toISOString().split('T')[0])
      .lte('follow_up_date', monthEnd.toISOString().split('T')[0])
      .not('follow_up_date', 'is', null)
      .order('follow_up_date', { ascending: true });

    if (contactsData) {
      // Récupérer les infos des entreprises
      const leadIds = [...new Set(contactsData.map(c => c.lead_id))];
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, company_name, company_address, company_website, company_linkedin, company_sector, company_headcount')
        .in('id', leadIds);

      const leadsMap = new Map(leadsData?.map(l => [l.id, l]) || []);

      const meetingsWithCompanies: Meeting[] = contactsData.map(contact => ({
        ...contact,
        company_name: leadsMap.get(contact.lead_id)?.company_name || 'Entreprise inconnue'
      }));

      setMeetings(meetingsWithCompanies);
    }

    setLoading(false);
  };

  const handleContactClick = async (meeting: Meeting) => {
    // Récupérer les détails complets
    const { data: leadData } = await supabase
      .from('leads')
      .select('company_address, company_website, company_linkedin, company_sector, company_headcount')
      .eq('id', meeting.lead_id)
      .single();

    setSelectedContact({
      ...meeting,
      company_address: leadData?.company_address || null,
      company_website: leadData?.company_website || null,
      company_linkedin: leadData?.company_linkedin || null,
      company_sector: leadData?.company_sector || null,
      company_headcount: leadData?.company_headcount || null,
    });
    setIsDialogOpen(true);
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
                    className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleContactClick(meeting)}
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
                  className="flex items-center justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-accent/50 transition-colors p-2 -m-2 rounded"
                  onClick={() => handleContactClick(meeting)}
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

      {/* Dialog fiche contact */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Fiche Contact</DialogTitle>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-6">
              {/* Informations Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Nom</div>
                    <div className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedContact.full_name}
                    </div>
                  </div>
                  {selectedContact.role && (
                    <div>
                      <div className="text-sm text-muted-foreground">Fonction</div>
                      <div className="font-medium">{selectedContact.role}</div>
                    </div>
                  )}
                  {selectedContact.email && (
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <a
                        href={`mailto:${selectedContact.email}`}
                        className="font-medium flex items-center gap-2 text-primary hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        {selectedContact.email}
                      </a>
                    </div>
                  )}
                  {selectedContact.phone && (
                    <div>
                      <div className="text-sm text-muted-foreground">Téléphone</div>
                      <a
                        href={`tel:${selectedContact.phone}`}
                        className="font-medium flex items-center gap-2 text-primary hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        {selectedContact.phone}
                      </a>
                    </div>
                  )}
                  {selectedContact.linkedin && (
                    <div className="col-span-2">
                      <div className="text-sm text-muted-foreground">LinkedIn</div>
                      <a
                        href={selectedContact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium flex items-center gap-2 text-primary hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        Profil LinkedIn
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations Entreprise */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Entreprise</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Nom</div>
                    <div className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {selectedContact.company_name}
                    </div>
                  </div>
                  {selectedContact.company_sector && (
                    <div>
                      <div className="text-sm text-muted-foreground">Secteur</div>
                      <div className="font-medium">{selectedContact.company_sector}</div>
                    </div>
                  )}
                  {selectedContact.company_headcount && (
                    <div>
                      <div className="text-sm text-muted-foreground">Effectif</div>
                      <div className="font-medium">{selectedContact.company_headcount} employés</div>
                    </div>
                  )}
                  {selectedContact.company_address && (
                    <div className="col-span-2">
                      <div className="text-sm text-muted-foreground">Adresse</div>
                      <div className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {selectedContact.company_address}
                      </div>
                    </div>
                  )}
                  {selectedContact.company_website && (
                    <div>
                      <div className="text-sm text-muted-foreground">Site web</div>
                      <a
                        href={selectedContact.company_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium flex items-center gap-2 text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Site web
                      </a>
                    </div>
                  )}
                  {selectedContact.company_linkedin && (
                    <div>
                      <div className="text-sm text-muted-foreground">LinkedIn Entreprise</div>
                      <a
                        href={selectedContact.company_linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium flex items-center gap-2 text-primary hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        Page LinkedIn
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* RDV et Statut */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Rendez-vous</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(parseISO(selectedContact.follow_up_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Statut</div>
                    <Badge className={getStatusColor(selectedContact.status)}>
                      {selectedContact.status}
                    </Badge>
                  </div>
                  {selectedContact.note && (
                    <div className="col-span-2">
                      <div className="text-sm text-muted-foreground">Notes</div>
                      <div className="font-medium bg-muted p-3 rounded-md">
                        {selectedContact.note}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
