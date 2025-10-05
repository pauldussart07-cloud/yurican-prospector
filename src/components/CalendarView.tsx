import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarViewProps {
  nextMeeting?: {
    date: Date;
    companyName: string;
    contactName: string;
  } | null;
}

export function CalendarView({ nextMeeting }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { locale: fr, weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { locale: fr, weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`p-2 border rounded text-center ${
              isSameDay(day, new Date()) ? 'bg-primary/10 border-primary' : ''
            }`}
          >
            <div className="text-xs font-medium">{format(day, 'EEE', { locale: fr })}</div>
            <div className="text-lg">{format(day, 'd')}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="text-center py-8">
        <div className="text-3xl font-bold">{format(selectedDate, 'd')}</div>
        <div className="text-muted-foreground">{format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Agenda</CardTitle>
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
              className="pointer-events-auto"
            />
          )}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </CardContent>
      </Card>

      {nextMeeting && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Prochain RDV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg font-semibold">
                {format(nextMeeting.date, 'dd MMMM yyyy', { locale: fr })}
              </div>
              <div className="text-sm text-muted-foreground">
                {nextMeeting.companyName}
              </div>
              <div className="text-sm text-muted-foreground">
                {nextMeeting.contactName}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
