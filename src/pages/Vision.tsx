import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTargeting } from '@/contexts/TargetingContext';
import { StatusHistogram } from '@/components/StatusHistogram';
import { GeographicMap } from '@/components/GeographicMap';
import { SignalStats } from '@/components/SignalStats';
import { NewsArticle } from '@/components/NewsArticle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Lead {
  id: string;
  status: string;
  company_department: string | null;
  is_hot_signal: boolean;
}

interface LeadContact {
  lead_id: string;
  status: string;
}

type ContactStatus = 'Nouveau' | 'Engagé' | 'Discussion' | 'RDV' | 'Exclu';

const STATUS_HIERARCHY: ContactStatus[] = ['Nouveau', 'Engagé', 'Discussion', 'RDV', 'Exclu'];

// Fonction pour obtenir le statut le plus avancé
const getMostAdvancedStatus = (statuses: ContactStatus[]): ContactStatus => {
  if (statuses.length === 0) return 'Nouveau';
  
  let maxIndex = 0;
  statuses.forEach(status => {
    const index = STATUS_HIERARCHY.indexOf(status);
    if (index > maxIndex) maxIndex = index;
  });
  
  return STATUS_HIERARCHY[maxIndex];
};

// Fonction pour obtenir le statut d'un lead basé sur ses contacts
const getLeadStatus = (leadId: string, contacts: LeadContact[]): ContactStatus => {
  const leadContacts = contacts.filter(c => c.lead_id === leadId);
  if (leadContacts.length === 0) return 'Nouveau';
  
  const statuses = leadContacts.map(c => c.status as ContactStatus);
  return getMostAdvancedStatus(statuses);
};

const Vision = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadContacts, setLeadContacts] = useState<LeadContact[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeTargeting } = useTargeting();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [leadsResult, contactsResult] = await Promise.all([
        supabase
          .from('leads')
          .select('id, status, company_department, is_hot_signal')
          .eq('user_id', user.id),
        supabase
          .from('lead_contacts')
          .select('lead_id, status')
          .eq('user_id', user.id)
      ]);

      if (leadsResult.data) setLeads(leadsResult.data);
      if (contactsResult.data) setLeadContacts(contactsResult.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Calculer les données pour l'histogramme des statuts basé sur les contacts
  const statusData = [
    { status: 'Nouveau', count: leads.filter(l => getLeadStatus(l.id, leadContacts) === 'Nouveau').length },
    { status: 'Engagé', count: leads.filter(l => getLeadStatus(l.id, leadContacts) === 'Engagé').length },
    { status: 'Discussion', count: leads.filter(l => getLeadStatus(l.id, leadContacts) === 'Discussion').length },
    { status: 'RDV', count: leads.filter(l => getLeadStatus(l.id, leadContacts) === 'RDV').length },
    { status: 'Exclu', count: leads.filter(l => getLeadStatus(l.id, leadContacts) === 'Exclu').length },
  ].filter(item => item.count > 0);

  // Calculer la répartition géographique
  const departmentCounts = leads.reduce((acc, lead) => {
    const dept = lead.company_department || 'Non spécifié';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const geographicData = Object.entries(departmentCounts)
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  // Calculer les statistiques des signaux
  const hotSignalLeads = leads.filter(l => l.is_hot_signal);
  const leadsWithContacts = new Set(leadContacts.map(c => c.lead_id));

  const signalUndiscovered = hotSignalLeads.filter(l => getLeadStatus(l.id, leadContacts) === 'Nouveau').length;
  const signalDiscoveredNoContacts = hotSignalLeads.filter(l => 
    getLeadStatus(l.id, leadContacts) !== 'Nouveau' && !leadsWithContacts.has(l.id)
  ).length;
  const signalWithContacts = hotSignalLeads.filter(l => leadsWithContacts.has(l.id)).length;

  // Articles de presse mockés liés aux secteurs du ciblage
  const newsArticles = [
    {
      title: "Les entreprises de technologie adoptent l'IA générative",
      sector: "Technologie",
      summary: "Les entreprises tech investissent massivement dans l'IA générative pour améliorer leurs processus et créer de nouveaux produits innovants dans un marché en pleine transformation digitale.",
      link: "https://figaro.fr",
      source: "Figaro"
    },
    {
      title: "Croissance du secteur industriel en France",
      sector: "Industrie",
      summary: "Le secteur industriel français connaît une reprise significative avec des investissements records dans la modernisation des outils de production et l'automatisation des chaînes de fabrication.",
      link: "https://lesechos.fr",
      source: "Les Echos"
    },
    {
      title: "Le commerce en ligne transforme la distribution",
      sector: "Commerce",
      summary: "Les distributeurs traditionnels accélèrent leur transformation digitale face à l'essor du e-commerce et des nouveaux modes de consommation post-pandémie qui redéfinissent le retail.",
      link: "https://leparisien.fr",
      source: "Parisien"
    },
    {
      title: "Innovation dans les services aux entreprises",
      sector: "Services",
      summary: "Les entreprises de services BtoB développent de nouvelles offres basées sur l'IA et l'automatisation pour répondre aux besoins croissants de digitalisation de leurs clients professionnels.",
      link: "https://ouest-france.fr",
      source: "Ouest France"
    }
  ];

  const totalLeads = leads.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-6">
        {/* Section principale - 2/3 de la page */}
        <div className="flex-[2] space-y-6">
          {/* Bloc Business - Data Ciblage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Business</CardTitle>
              <p className="text-3xl font-bold mt-2">{totalLeads} sociétés</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <StatusHistogram 
                  data={statusData}
                  onStatusClick={(status) => navigate(`/prospects?status=${status}`)}
                />
                <GeographicMap data={geographicData} />
              </div>
            </CardContent>
          </Card>

          {/* Bloc Prospects Chauds */}
          <SignalStats 
            undiscovered={signalUndiscovered}
            discoveredNoContacts={signalDiscoveredNoContacts}
            withContacts={signalWithContacts}
            onUndiscoveredClick={() => navigate('/prospects?view=signal&status=Nouveau')}
            onDiscoveredNoContactsClick={() => navigate('/prospects?view=signal&noContacts=true')}
            onWithContactsClick={() => navigate('/prospects?view=signal&hasContacts=true')}
          />
        </div>

        {/* Section actualités - 1/3 de la page */}
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-bold">Actualité</h2>
          {newsArticles.map((article, index) => (
            <NewsArticle key={index} {...article} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Vision;
