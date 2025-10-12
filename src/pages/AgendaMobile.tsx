import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { fr } from 'date-fns/locale';
import { format, isSameDay, parseISO } from 'date-fns';
import { CalendarIcon, Building2, User, Clock, Mail, Phone, Linkedin, Globe, ChevronRight } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';

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
  company_website: string | null;
  company_linkedin: string | null;
}

const AgendaMobile = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ContactDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: contactsData } = await supabase
      .from('lead_contacts')
      .select('id, follow_up_date, full_name, lead_id, status, note, email, phone, linkedin, role')
      .eq('user_id', user.id)
      .not('follow_up_date', 'is', null)
      .order('follow_up_date', { ascending: true });

    if (contactsData) {
      const leadIds = [...new Set(contactsData.map(c => c.lead_id))];
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, company_name')
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
    const { data: leadData } = await supabase
      .from('leads')
      .select('company_website, company_linkedin')
      .eq('id', meeting.lead_id)
      .single();

    setSelectedContact({
      ...meeting,
      company_website: leadData?.company_website || null,
      company_linkedin: leadData?.company_linkedin || null,
    });
    setIsDrawerOpen(true);
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

  const handleOpenLink = (url: string) => {
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Agenda Mobile
        </h1>
        <Button onClick={() => setSelectedDate(new Date())} variant="outline" size="sm">
          Aujourd'hui
        </Button>
      </div>

      {/* Calendrier */}
      <Card>
        <CardContent className="pt-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={fr}
            className="w-full"
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
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
        </h2>
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
        ) : meetingsOnSelectedDate.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">Aucun RDV ce jour</p>
            </CardContent>
          </Card>
        ) : (
          meetingsOnSelectedDate.map((meeting) => (
            <Card
              key={meeting.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleContactClick(meeting)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {format(parseISO(meeting.follow_up_date), 'HH:mm', { locale: fr })}
                      </span>
                      <Badge className={`${getStatusColor(meeting.status)} ml-auto`}>
                        {meeting.status}
                      </Badge>
                    </div>
                    <div className="font-semibold">{meeting.company_name}</div>
                    <div className="text-sm text-muted-foreground">{meeting.full_name}</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Drawer fiche contact */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Détails du RDV</DrawerTitle>
            <DrawerDescription>
              {selectedContact && `${selectedContact.company_name} - ${selectedContact.full_name}`}
            </DrawerDescription>
          </DrawerHeader>

          {selectedContact && (
            <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Informations du RDV */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Date et heure</div>
                    <div className="font-semibold">
                      {format(parseISO(selectedContact.follow_up_date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Entreprise</div>
                    <div className="font-semibold">{selectedContact.company_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Contact</div>
                    <div>{selectedContact.full_name}</div>
                  </div>
                  {selectedContact.role && (
                    <div>
                      <div className="text-sm text-muted-foreground">Rôle</div>
                      <div>{selectedContact.role}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">Statut</div>
                    <Badge className={getStatusColor(selectedContact.status)}>
                      {selectedContact.status}
                    </Badge>
                  </div>
                  {selectedContact.note && (
                    <div>
                      <div className="text-sm text-muted-foreground">Note</div>
                      <div className="text-sm">{selectedContact.note}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <div className="text-sm font-medium mb-3">Actions rapides</div>
                  
                  {selectedContact.email && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(`mailto:${selectedContact.email}`, '_blank')}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedContact.email}
                    </Button>
                  )}

                  {selectedContact.phone && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(`tel:${selectedContact.phone}`, '_blank')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedContact.phone}
                    </Button>
                  )}

                  {selectedContact.linkedin && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleOpenLink(selectedContact.linkedin)}
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn du contact
                    </Button>
                  )}

                  {selectedContact.company_website && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleOpenLink(selectedContact.company_website)}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Site web de l'entreprise
                    </Button>
                  )}

                  {selectedContact.company_linkedin && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleOpenLink(selectedContact.company_linkedin)}
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn de l'entreprise
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default AgendaMobile;
