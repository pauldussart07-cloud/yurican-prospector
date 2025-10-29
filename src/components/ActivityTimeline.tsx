import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, FileText, Mail, Calendar, TrendingUp, CheckCircle2 } from 'lucide-react';

interface Activity {
  id: string;
  activity_type: 'note' | 'action' | 'status_change' | 'meeting';
  activity_description: string;
  previous_value?: string;
  new_value?: string;
  created_at: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
  limit?: number;
  onActivityClick?: (activity: Activity) => void;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'note':
      return <FileText className="h-4 w-4" />;
    case 'action':
      return <Mail className="h-4 w-4" />;
    case 'status_change':
      return <TrendingUp className="h-4 w-4" />;
    case 'meeting':
      return <Calendar className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'note':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'action':
      return 'bg-secondary/10 text-secondary border-secondary/20';
    case 'status_change':
      return 'bg-accent text-accent-foreground border-accent';
    case 'meeting':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export const ActivityTimeline = ({ activities, limit, onActivityClick }: ActivityTimelineProps) => {
  const displayedActivities = limit ? activities.slice(0, limit) : activities;

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm">Aucune activité enregistrée</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity, index) => (
        <div 
          key={activity.id} 
          className={`flex gap-3 relative ${onActivityClick && activity.activity_type === 'meeting' ? 'cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors' : ''}`}
          onClick={() => {
            if (onActivityClick && activity.activity_type === 'meeting') {
              onActivityClick(activity);
            }
          }}
        >
          {/* Timeline line */}
          {index !== displayedActivities.length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border" />
          )}
          
          {/* Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getActivityColor(activity.activity_type)}`}>
            {getActivityIcon(activity.activity_type)}
          </div>
          
          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {activity.activity_description}
              </p>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(activity.created_at), 'dd MMM HH:mm', { locale: fr })}
              </span>
            </div>
            
            {activity.previous_value && activity.new_value && (
              <div className="mt-1 text-xs text-muted-foreground">
                <span className="line-through opacity-60">{activity.previous_value}</span>
                {' → '}
                <span className="font-medium text-foreground">{activity.new_value}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
