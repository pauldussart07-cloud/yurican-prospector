import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fr } from 'date-fns/locale';
import { format, isSameDay, startOfMonth, endOfMonth, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { CalendarIcon, Building2, User, Clock, Mail, Phone, Linkedin, MapPin, Globe, ChevronLeft, ChevronRight } from 'lucide-react';

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
  company_summary: string | null;
  signal_summary: string | null;
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
  }, [selectedDate, viewMode]);

  const fetchMeetings = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Récupérer les RDV selon la vue
    let startDate, endDate;
    
    if (viewMode === 'month') {
      startDate = startOfMonth(selectedDate);
      endDate = endOfMonth(selectedDate);
    } else if (viewMode === 'week') {
      startDate = startOfWeek(selectedDate, { locale: fr, weekStartsOn: 1 });
      endDate = endOfWeek(selectedDate, { locale: fr, weekStartsOn: 1 });
    } else {
      startDate = selectedDate;
      endDate = selectedDate;
    }

    const { data: contactsData } = await supabase
      .from('lead_contacts')
      .select('id, follow_up_date, full_name, lead_id, status, note, email, phone, linkedin, role')
      .eq('user_id', user.id)
      .gte('follow_up_date', startDate.toISOString().split('T')[0])
      .lte('follow_up_date', endDate.toISOString().split('T')[0])
      .not('follow_up_date', 'is', null)
      .order('follow_up_date', { ascending: true });

    if (contactsData) {
      // Récupérer les infos des entreprises
      const leadIds = [...new Set(contactsData.map(c => c.lead_id))];
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, company_name, company_address, company_website, company_linkedin, company_sector, company_headcount, signal_summary')
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
      .select('company_address, company_website, company_linkedin, company_sector, company_headcount, signal_summary')
      .eq('id', meeting.lead_id)
      .single();

    setSelectedContact({
      ...meeting,
      company_address: leadData?.company_address || null,
      company_website: leadData?.company_website || null,
      company_linkedin: leadData?.company_linkedin || null,
      company_sector: leadData?.company_sector || null,
      company_headcount: leadData?.company_headcount || null,
      company_summary: null, // À implémenter via un service AI
      signal_summary: leadData?.signal_summary || null,
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

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { locale: fr, weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    return (
      <div className="space-y-2">
        {weekDays.map((day) => {
          const dayMeetings = meetings.filter(m => isSameDay(parseISO(m.follow_up_date), day));
          return (
            <div key={day.toISOString()} className="border rounded-lg p-3">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <span className={isSameDay(day, new Date()) ? 'text-primary' : ''}>
                  {format(day, 'EEEE d MMMM', { locale: fr })}
                </span>
                {dayMeetings.length > 0 && (
                  <Badge variant="secondary">{dayMeetings.length}</Badge>
                )}
              </div>
              {dayMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun RDV</p>
              ) : (
                <div className="space-y-2">
                  {dayMeetings.map(meeting => (
                    <div
                      key={meeting.id}
                      className="text-sm p-2 bg-accent/50 rounded cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleContactClick(meeting)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{meeting.full_name}</span>
                        <Badge className={`${getStatusColor(meeting.status)} text-xs`}>
                          {meeting.status}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">{meeting.company_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayMeetings = meetingsOnSelectedDate;

    return (
      <div className="space-y-4">
        <div className="text-center py-4 border-b">
          <div className="text-3xl font-bold">{format(selectedDate, 'd')}</div>
          <div className="text-muted-foreground">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </div>
        </div>
        {dayMeetings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aucun RDV ce jour</p>
        ) : (
          <div className="space-y-3">
            {dayMeetings.map((meeting) => (
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
      </div>
    );
  };

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      setSelectedDate(addDays(selectedDate, -7));
    } else {
      setSelectedDate(addDays(selectedDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      setSelectedDate(addDays(selectedDate, 7));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const getViewTitle = () => {
    if (viewMode === 'month') {
      return format(selectedDate, 'MMMM yyyy', { locale: fr });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { locale: fr, weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { locale: fr, weekStartsOn: 1 });
      return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`;
    } else {
      return format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-8 w-8" />
          Agenda
        </h1>
        <Button onClick={() => setSelectedDate(new Date())} variant="outline">
          Aujourd'hui
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendrier principal */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg capitalize">{getViewTitle()}</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Mois
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Semaine
                </Button>
                <Button
                  variant={viewMode === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                >
                  Jour
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'month' && (
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
            )}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </CardContent>
        </Card>

        {/* RDV du jour sélectionné - uniquement en vue mois */}
        {viewMode === 'month' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : meetingsOnSelectedDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun RDV ce jour</p>
              ) : (
                <div className="space-y-3">
                  {meetingsOnSelectedDate.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleContactClick(meeting)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">
                            {format(parseISO(meeting.follow_up_date), 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <Badge className={`${getStatusColor(meeting.status)} text-xs`}>
                          {meeting.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-semibold">{meeting.company_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{meeting.full_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Liste tous les RDV de la période */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {viewMode === 'month' && 'Tous les RDV du mois'}
            {viewMode === 'week' && 'Tous les RDV de la semaine'}
            {viewMode === 'day' && 'Tous les RDV du jour'}
          </CardTitle>
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
            <DialogTitle className="text-2xl">
              {selectedContact ? `RDV - ${selectedContact.company_name} - ${selectedContact.full_name}` : 'Fiche Contact'}
            </DialogTitle>
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
                
                {/* Résumé de l'entreprise */}
                {selectedContact.company_summary && (
                  <div className="col-span-2 bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      À propos de l'entreprise
                    </div>
                    <div className="text-sm leading-relaxed">
                      {selectedContact.company_summary}
                    </div>
                  </div>
                )}
                
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

              {/* Actualité / Signal */}
              {selectedContact.signal_summary && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Actualité & Signaux</h3>
                  <div className="bg-accent/50 p-4 rounded-lg border border-accent">
                    <div className="text-sm leading-relaxed">
                      {selectedContact.signal_summary}
                    </div>
                  </div>
                </div>
              )}

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
