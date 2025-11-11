import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface SequenceStats {
  name: string;
  total_contacts: number;
  active_contacts: number;
  completed_contacts: number;
  emails_sent: number;
  opens: number;
  replies: number;
  step_distribution: { step_order: number; step_name: string; count: number }[];
  daily_activity: { date: string; sent: number; opened: number; replied: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const SequenceAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SequenceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAnalytics();
    }
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch sequence info
      const { data: sequence, error: seqError } = await supabase
        .from('sequences')
        .select('name')
        .eq('id', id)
        .single();

      if (seqError) throw seqError;

      // Fetch enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('sequence_enrollments')
        .select('current_step, status')
        .eq('sequence_id', id);

      if (enrollError) throw enrollError;

      // Fetch steps
      const { data: steps, error: stepsError } = await supabase
        .from('sequence_steps')
        .select('step_order, step_type')
        .eq('sequence_id', id)
        .order('step_order');

      if (stepsError) throw stepsError;

      // Calculate step distribution
      const stepDistribution = (steps || []).map(step => ({
        step_order: step.step_order + 1,
        step_name: `Étape ${step.step_order + 1} - ${step.step_type === 'email' ? 'Email' : step.step_type === 'whatsapp' ? 'WhatsApp' : 'LinkedIn'}`,
        count: (enrollments || []).filter(e => e.current_step === step.step_order).length
      }));

      // Fetch analytics events
      const { data: analytics, error: analyticsError } = await supabase
        .from('sequence_analytics')
        .select('event_type, event_date')
        .eq('sequence_id', id)
        .order('event_date', { ascending: true });

      if (analyticsError) throw analyticsError;

      // Calculate daily activity
      const dailyMap = new Map<string, { sent: number; opened: number; replied: number }>();
      (analytics || []).forEach(event => {
        const date = new Date(event.event_date).toLocaleDateString('fr-FR');
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { sent: 0, opened: 0, replied: 0 });
        }
        const day = dailyMap.get(date)!;
        if (event.event_type === 'sent') day.sent++;
        if (event.event_type === 'opened') day.opened++;
        if (event.event_type === 'replied') day.replied++;
      });

      const dailyActivity = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .slice(-30); // Last 30 days

      const totalContacts = enrollments?.length || 0;
      const activeContacts = enrollments?.filter(e => e.status === 'active').length || 0;
      const completedContacts = enrollments?.filter(e => e.status === 'completed').length || 0;

      const emailsSent = analytics?.filter(e => e.event_type === 'sent').length || 0;
      const opens = analytics?.filter(e => e.event_type === 'opened').length || 0;
      const replies = analytics?.filter(e => e.event_type === 'replied').length || 0;

      setStats({
        name: sequence.name,
        total_contacts: totalContacts,
        active_contacts: activeContacts,
        completed_contacts: completedContacts,
        emails_sent: emailsSent,
        opens,
        replies,
        step_distribution: stepDistribution,
        daily_activity: dailyActivity
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Aucune donnée disponible</div>
      </div>
    );
  }

  const openRate = stats.emails_sent > 0 ? (stats.opens / stats.emails_sent) * 100 : 0;
  const replyRate = stats.emails_sent > 0 ? (stats.replies / stats.emails_sent) * 100 : 0;

  const statusData = [
    { name: 'Actifs', value: stats.active_contacts },
    { name: 'Terminés', value: stats.completed_contacts }
  ];

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sequences')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{stats.name}</h1>
            <p className="text-muted-foreground">Statistiques et analyses de la séquence</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Contacts actifs"
            value={stats.active_contacts}
            subtitle={`${stats.total_contacts} au total`}
          />
          <KpiCard
            title="Emails envoyés"
            value={stats.emails_sent}
          />
          <KpiCard
            title="Taux d'ouverture"
            value={`${openRate.toFixed(1)}%`}
            subtitle={`${stats.opens} ouvertures`}
          />
          <KpiCard
            title="Taux de réponse"
            value={`${replyRate.toFixed(1)}%`}
            subtitle={`${stats.replies} réponses`}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Step Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution par étape</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.step_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="step_order" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Statut des contacts</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Daily Activity Chart */}
        {stats.daily_activity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Activité quotidienne (30 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.daily_activity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    fontSize={11}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Line type="monotone" dataKey="sent" stroke="hsl(var(--primary))" name="Envoyés" />
                  <Line type="monotone" dataKey="opened" stroke="hsl(var(--secondary))" name="Ouverts" />
                  <Line type="monotone" dataKey="replied" stroke="hsl(var(--accent))" name="Réponses" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SequenceAnalytics;
