import { useState, useMemo, useEffect } from 'react';
import { Building2, ExternalLink, Linkedin, FileText, ThumbsUp, ThumbsDown, Users, TrendingUp, MapPin, Contact, DollarSign, Briefcase, ArrowUp, ArrowDown, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { mockCompanies, Company, mockLeads, Lead } from '@/lib/mockData';
import { companySummaryService } from '@/services/companySummaryService';
import { contactsService } from '@/services/contactsService';
import { useNavigate } from 'react-router-dom';
import { useTargeting } from '@/contexts/TargetingContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Persona {
  id: string;
  name: string;
}

const Marche = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeTargeting, deductCredits, credits } = useTargeting();
  const [companies, setCompanies] = useState(mockCompanies);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  
  // Filtres
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [sortCriteria, setSortCriteria] = useState<'name' | 'sector' | 'revenue' | 'headcount' | 'department'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hideNoGo, setHideNoGo] = useState(true);

  // Pagination et sélection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [viewMode, setViewMode] = useState<'ciblage' | 'signal'>('ciblage');
  const [discoveredCompanies, setDiscoveredCompanies] = useState<Set<string>>(new Set());
  const [showDiscoverAlert, setShowDiscoverAlert] = useState(false);
  const [companyToDiscover, setCompanyToDiscover] = useState<Company | null>(null);
  const [expandedNews, setExpandedNews] = useState<Set<string>>(new Set());
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
  const [companySummaries, setCompanySummaries] = useState<Map<string, string>>(new Map());
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [showNoGoDialog, setShowNoGoDialog] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [contactCount, setContactCount] = useState(3);
  const [userPersonas, setUserPersonas] = useState<any[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [swipingCompanies, setSwipingCompanies] = useState<Map<string, 'left' | 'right'>>(new Map());
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if first visit to show onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('marche_onboarding_seen');
    if (!hasSeenOnboarding && !activeTargeting) {
      setShowOnboarding(true);
    }
  }, [activeTargeting]);

  const dismissOnboarding = () => {
    localStorage.setItem('marche_onboarding_seen', 'true');
    setShowOnboarding(false);
    navigate('/targeting');
  };

  const skipOnboarding = () => {
    localStorage.setItem('marche_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    const loadPersonas = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('personas')
        .select('id, name')
        .eq('user_id', user.id);

      if (data) {
        setPersonas(data);
      }
    };

    loadPersonas();
  }, []);

  // Charger les personas détaillées pour le dialog
  useEffect(() => {
    const loadDetailedPersonas = async () => {
      setLoadingPersonas(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingPersonas(false);
        return;
      }

      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (!error && data) {
        setUserPersonas(data);
      }
      setLoadingPersonas(false);
    };

    if (showPersonaDialog) {
      loadDetailedPersonas();
    }
  }, [showPersonaDialog]);

  const handleCompanyClick = async (company: Company) => {
    // En mode signal, vérifier si l'entreprise a été découverte
    if (viewMode === 'signal' && !discoveredCompanies.has(company.id)) {
      return;
    }
    
    setSelectedCompany(company);
    
    // Vérifier si on a déjà un résumé pour cette entreprise
    const existingSummary = companySummaries.get(company.id);
    if (existingSummary) {
      setSummary(existingSummary);
      return;
    }
    
    setSummary('');
    setLoadingSummary(true);
    
    try {
      const generatedSummary = await companySummaryService.summarize(company);
      setSummary(generatedSummary);
      // Stocker le résumé généré
      setCompanySummaries(prev => new Map(prev).set(company.id, generatedSummary));
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Erreur lors de la génération du résumé.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleDiscover = (company: Company) => {
    // Afficher l'alerte de confirmation
    setCompanyToDiscover(company);
    setShowDiscoverAlert(true);
  };

  const confirmDiscover = async () => {
    if (!companyToDiscover) return;

    // Vérifier si l'utilisateur a assez de crédits
    if (credits < 8) {
      toast({
        title: 'Crédits insuffisants',
        description: 'Vous n\'avez pas assez de crédits pour découvrir cette entreprise.',
        variant: 'destructive',
      });
      setShowDiscoverAlert(false);
      setCompanyToDiscover(null);
      return;
    }

    try {
      // Déduire les crédits via le contexte
      await deductCredits(8);

      // Marquer comme découverte
      setDiscoveredCompanies(prev => new Set(prev).add(companyToDiscover.id));
      
      // Ouvrir la fiche
      await handleCompanyClick(companyToDiscover);

      toast({
        title: 'Entreprise découverte',
        description: '8 crédits ont été déduits de votre solde.',
      });
    } catch (error) {
      console.error('Error deducting credits:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la déduction des crédits.',
        variant: 'destructive',
      });
    } finally {
      setShowDiscoverAlert(false);
      setCompanyToDiscover(null);
    }
  };

  const handleAddToProspects = async () => {
    if (selectedCompanies.size === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté pour ajouter des prospects.',
          variant: 'destructive',
        });
        return;
      }

      let addedCount = 0;
      const companiesToAdd = Array.from(selectedCompanies);

      for (const companyId of companiesToAdd) {
        const company = companies.find(c => c.id === companyId);
        if (!company) continue;

        const { error } = await supabase
          .from('leads')
          .upsert({
            user_id: user.id,
            company_id: company.id,
            company_name: company.name,
            company_sector: company.sector,
            company_department: company.department,
            company_ca: company.ca,
            company_headcount: company.headcount,
            company_website: company.website,
            company_linkedin: company.linkedin,
            company_address: company.address,
            company_siret: company.siret,
            company_naf: company.naf,
            status: 'Nouveau',
            is_hot_signal: viewMode === 'signal',
          }, {
            onConflict: 'user_id,company_id'
          });

        if (!error) {
          addedCount++;
        }
      }

      // Retirer les entreprises ajoutées de la liste
      setCompanies(companies.filter(c => !selectedCompanies.has(c.id)));
      setSelectedCompanies(new Set());

      toast({
        title: 'Entreprises ajoutées',
        description: `${addedCount} entreprise${addedCount > 1 ? 's ont été ajoutées' : ' a été ajoutée'} à vos prospects.`,
      });

      navigate('/prospects');
    } catch (error) {
      console.error('Error adding to prospects:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'ajout des prospects.',
        variant: 'destructive',
      });
    }
  };

  const handleGo = async (company: Company) => {
    // Déclencher l'animation de swipe vers la gauche
    setSwipingCompanies(prev => new Map(prev).set(company.id, 'left'));
    
    // Attendre la fin de l'animation
    setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: 'Erreur',
            description: 'Vous devez être connecté pour ajouter un lead.',
            variant: 'destructive',
          });
          setSwipingCompanies(prev => {
            const newMap = new Map(prev);
            newMap.delete(company.id);
            return newMap;
          });
          return;
        }

        // Créer ou mettre à jour un lead dans Supabase
        const { error } = await supabase
          .from('leads')
          .upsert({
            user_id: user.id,
            company_id: company.id,
            company_name: company.name,
            company_sector: company.sector,
            company_department: company.department,
            company_ca: company.ca,
            company_headcount: company.headcount,
            company_website: company.website,
            company_linkedin: company.linkedin,
            company_address: company.address,
            company_siret: company.siret,
            company_naf: company.naf,
            status: 'Nouveau',
            is_hot_signal: viewMode === 'signal',
          }, {
            onConflict: 'user_id,company_id'
          });

        if (error) {
          console.error('Error saving lead:', error);
          toast({
            title: 'Erreur',
            description: 'Impossible d\'ajouter le lead.',
            variant: 'destructive',
          });
          setSwipingCompanies(prev => {
            const newMap = new Map(prev);
            newMap.delete(company.id);
            return newMap;
          });
          return;
        }

        // Retirer l'entreprise de la liste
        setCompanies(companies.filter(c => c.id !== company.id));
        setSwipingCompanies(prev => {
          const newMap = new Map(prev);
          newMap.delete(company.id);
          return newMap;
        });

        toast({
          title: 'Entreprise ajoutée',
          description: `${company.name} a été ajouté à vos prospects.`,
        });
        
        setSelectedCompany(null);
      } catch (error) {
        console.error('Error in handleGo:', error);
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue.',
          variant: 'destructive',
        });
        setSwipingCompanies(prev => {
          const newMap = new Map(prev);
          newMap.delete(company.id);
          return newMap;
        });
      }
    }, 300);
  };

  const handleNoGo = (company: Company) => {
    // Déclencher l'animation de swipe vers la droite
    setSwipingCompanies(prev => new Map(prev).set(company.id, 'right'));
    
    // Attendre la fin de l'animation
    setTimeout(() => {
      setCompanies(companies.map(c => 
        c.id === company.id ? { ...c, isHidden: true } : c
      ));
      
      setSwipingCompanies(prev => {
        const newMap = new Map(prev);
        newMap.delete(company.id);
        return newMap;
      });
      
      toast({
        title: 'Entreprise masquée',
        description: `${company.name} ne sera plus affichée.`,
        variant: 'destructive',
      });
      
      setSelectedCompany(null);
      setShowNoGoDialog(true);
    }, 300);
  };

  // Filtrer et trier les entreprises avec le ciblage actif
  const filteredCompanies = useMemo(() => {
    let filtered = companies.filter(c => !hideNoGo || !c.isHidden);

    // En mode signal, filtrer uniquement les entreprises qui ont des signaux
    if (viewMode === 'signal') {
      const signalCompanyIds = new Set(
        leads.filter(l => l.isHotSignal).map(l => l.companyId)
      );
      filtered = filtered.filter(c => signalCompanyIds.has(c.id));
      
      // Filtrer par type d'événement si sélectionné
      if (eventTypeFilter !== 'all') {
        // Pour l'instant, on simule le filtrage - à remplacer par la vraie logique
        // quand les types d'événements seront stockés en base de données
        filtered = filtered.filter(c => {
          // Simulation : alterner les types d'événements selon l'ID
          const eventTypes = ['appel_offre', 'recrutement', 'levee_fonds', 'expansion'];
          const index = parseInt(c.id) % eventTypes.length;
          return eventTypes[index] === eventTypeFilter;
        });
      }
    }

    // Apply targeting filter if active
    if (activeTargeting) {
      filtered = filtered.filter(c => {
        // Filter by departments
        if (activeTargeting.departments?.length > 0 && !activeTargeting.departments.includes(c.department)) {
          return false;
        }
        
        // Filter by sectors
        if (activeTargeting.sectors?.length > 0 && !activeTargeting.sectors.some(s => c.sector.toLowerCase().includes(s.toLowerCase()))) {
          return false;
        }
        
        // Filter by headcount
        if (activeTargeting.min_headcount && c.headcount < activeTargeting.min_headcount) {
          return false;
        }
        if (activeTargeting.max_headcount && c.headcount > activeTargeting.max_headcount) {
          return false;
        }
        
        // Filter by revenue
        if (activeTargeting.min_revenue && c.ca < activeTargeting.min_revenue) {
          return false;
        }
        if (activeTargeting.max_revenue && c.ca > activeTargeting.max_revenue) {
          return false;
        }
        
        return true;
      });
    }

    // Apply department filter
    filtered = filtered.filter(c => departmentFilter === 'all' || c.department === departmentFilter);

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortCriteria) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'sector':
          comparison = a.sector.localeCompare(b.sector);
          break;
        case 'revenue':
          comparison = a.ca - b.ca;
          break;
        case 'headcount':
          comparison = a.headcount - b.headcount;
          break;
        case 'department':
          comparison = a.department.localeCompare(b.department);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [companies, hideNoGo, viewMode, eventTypeFilter, activeTargeting, departmentFilter, sortCriteria, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  const handleSelectAll = () => {
    if (selectedCompanies.size === paginatedCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(paginatedCompanies.map(c => c.id)));
    }
  };

  const handleSelectCompany = (companyId: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  const handleGetContacts = () => {
    if (selectedCompanies.size === 0) return;
    setShowPersonaDialog(true);
  };

  const handlePersonaToggle = (personaName: string) => {
    setSelectedPersonas(prev =>
      prev.includes(personaName)
        ? prev.filter(p => p !== personaName)
        : [...prev, personaName]
    );
  };

  const handleConfirmGetContacts = async () => {
    if (selectedPersonas.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins un ciblage.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté.',
          variant: 'destructive',
        });
        return;
      }

      // Récupérer les personas complètes
      const selectedPersonaObjects = userPersonas.filter(p => 
        selectedPersonas.includes(p.name)
      );

      let totalContactsCreated = 0;

      // Pour chaque entreprise sélectionnée
      for (const companyId of Array.from(selectedCompanies)) {
        const company = companies.find(c => c.id === companyId);
        if (!company) continue;

        // Récupérer le signal depuis mockLeads si disponible
        const existingLead = mockLeads.find(l => l.companyId === company.id);
        
        // Créer ou mettre à jour le lead
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .upsert({
            user_id: user.id,
            company_id: company.id,
            company_name: company.name,
            company_sector: company.sector,
            company_department: company.department,
            company_ca: company.ca,
            company_headcount: company.headcount,
            company_website: company.website,
            company_linkedin: company.linkedin,
            company_address: company.address,
            company_siret: company.siret,
            company_naf: company.naf,
            status: 'Nouveau',
            is_hot_signal: existingLead?.isHotSignal || false,
            signal_summary: existingLead?.signalSummary || null,
          }, {
            onConflict: 'user_id,company_id'
          })
          .select()
          .single();

        if (leadError) {
          console.error('Error creating lead:', leadError);
          continue;
        }

        // Générer les contacts
        const newContacts = await contactsService.generateContacts({
          companyId: company.id,
          companyName: company.name,
          personas: selectedPersonaObjects,
          count: contactCount,
        });

        // Insérer les contacts dans la base de données
        for (const contact of newContacts) {
          const { error: contactError } = await supabase
            .from('lead_contacts')
            .insert({
              user_id: user.id,
              lead_id: leadData.id,
              full_name: contact.fullName,
              role: contact.role,
              email: contact.email,
              phone: contact.phone,
              linkedin: '',
              status: 'Nouveau',
            });

          if (!contactError) {
            totalContactsCreated++;
          }
        }
      }

      toast({
        title: 'Contacts générés',
        description: `${totalContactsCreated} contact(s) ont été ajoutés pour ${selectedCompanies.size} entreprise(s).`,
      });

      // Réinitialiser
      setShowPersonaDialog(false);
      setSelectedPersonas([]);
      setContactCount(3);
      setSelectedCompanies(new Set());
      
      // Rediriger vers la page Prospects
      navigate('/prospects');
    } catch (error) {
      console.error('Error generating contacts:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération des contacts.',
        variant: 'destructive',
      });
    }
  };

  const departments = Array.from(new Set(companies.map(c => c.department))).sort();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      {/* Onboarding overlay for first-time users */}
      {showOnboarding && (
        <>
          {/* Backdrop grisé */}
          <div className="fixed inset-0 bg-black/60 z-40" onClick={skipOnboarding} />
          
          {/* Bulle d'onboarding */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="relative pointer-events-auto animate-scale-in">
              {/* Flèche vers le bouton */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <svg 
                  width="40" 
                  height="60" 
                  viewBox="0 0 40 60" 
                  className="text-white animate-bounce"
                >
                  <path 
                    d="M20 0 L20 45 M10 35 L20 45 L30 35" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              
              {/* Card principale */}
              <Card className="max-w-md bg-white shadow-2xl border-2 border-primary/20">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Bienvenue sur le Marché !</h3>
                  <p className="text-muted-foreground mb-4">
                    Pour découvrir les entreprises qui correspondent à votre activité, 
                    commencez par créer votre premier ciblage. Définissez vos critères 
                    (secteur, taille, localisation) et nous vous proposerons les meilleures opportunités.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button onClick={dismissOnboarding} className="w-full">
                      <Target className="h-4 w-4 mr-2" />
                      Créer mon premier Ciblage
                    </Button>
                    <Button variant="ghost" size="sm" onClick={skipOnboarding} className="text-muted-foreground">
                      Plus tard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Marché</h1>
        <Badge variant="outline" className="text-sm bg-white border-border flex items-center">
          Votre Ciblage représente {filteredCompanies.length} entreprise{filteredCompanies.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Liste des entreprises */}
      <div className="space-y-3">
        {/* Header avec checkbox select all et actions */}
        {activeTargeting && (
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedCompanies.size === paginatedCompanies.length && paginatedCompanies.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Tout sélectionner
              </span>
            </div>
            
            <div className="flex items-center gap-3 border-l pl-4">
              <Label htmlFor="view-mode" className="text-sm font-medium">
                Ciblage
              </Label>
              <Switch
                id="view-mode"
                checked={viewMode === 'signal'}
                onCheckedChange={(checked) => setViewMode(checked ? 'signal' : 'ciblage')}
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="view-mode" className="text-sm font-medium">
                  Signal
                </Label>
                {filteredCompanies.length > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center px-1.5">
                    {filteredCompanies.length}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Actions quand des entreprises sont sélectionnées */}
            {selectedCompanies.size > 0 ? (
              <>
                <span className="font-medium text-sm">
                  {selectedCompanies.size} entreprise(s) sélectionnée(s)
                </span>
                <Button size="sm" onClick={handleAddToProspects}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Ajouter aux prospects
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCompanies(new Set())}
                >
                  Annuler
                </Button>
              </>
            ) : (
              <>
                {/* Filtres et tris */}
                {viewMode === 'signal' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Événement : {eventTypeFilter === 'all' && 'Tous'}
                        {eventTypeFilter === 'appel_offre' && 'Appel d\'offre'}
                        {eventTypeFilter === 'recrutement' && 'Recrutement'}
                        {eventTypeFilter === 'levee_fonds' && 'Levée de fonds'}
                        {eventTypeFilter === 'expansion' && 'Expansion'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background">
                      <DropdownMenuItem onClick={() => setEventTypeFilter('all')}>
                        Tous les événements
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEventTypeFilter('appel_offre')}>
                        Appel d'offre
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEventTypeFilter('recrutement')}>
                        Recrutement
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEventTypeFilter('levee_fonds')}>
                        Levée de fonds
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEventTypeFilter('expansion')}>
                        Expansion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Trier par {sortCriteria === 'name' && 'Nom de l\'entreprise'}
                      {sortCriteria === 'sector' && 'Secteur d\'activité'}
                      {sortCriteria === 'revenue' && 'Chiffre d\'affaires'}
                      {sortCriteria === 'headcount' && 'Effectif'}
                      {sortCriteria === 'department' && 'Département'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background">
                    <DropdownMenuItem onClick={() => setSortCriteria('name')}>
                      Nom de l'entreprise
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('sector')}>
                      Secteur d'activité
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('revenue')}>
                      Chiffre d'affaires
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('headcount')}>
                      Effectif
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('department')}>
                      Département
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>

                <Button
                  variant={hideNoGo ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setHideNoGo(!hideNoGo)}
                >
                  {hideNoGo ? 'Afficher NO GO' : 'Masquer NO GO'}
                </Button>
              </>
            )}
          </div>
        </div>
        )}

        {!activeTargeting ? (
          <Card className="p-12 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun ciblage sélectionné</h3>
            <p className="text-muted-foreground mb-4">Créez un ciblage pour voir les entreprises correspondantes</p>
            <Button onClick={() => navigate('/targeting')}>
              <Target className="h-4 w-4 mr-2" />
              Créer un Ciblage
            </Button>
          </Card>
        ) : paginatedCompanies.map((company) => {
          // Déterminer la taille de l'icône CA
          const getRevenueIcon = (ca: number) => {
            if (ca >= 50000000) return <TrendingUp className="h-5 w-5 text-green-600" />;
            if (ca >= 10000000) return <TrendingUp className="h-4 w-4 text-green-500" />;
            return <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />;
          };

          // Déterminer la taille de l'icône effectif
          const getHeadcountIcon = (headcount: number) => {
            if (headcount >= 250) return <Users className="h-5 w-5 text-blue-600" />;
            if (headcount >= 50) return <Users className="h-4 w-4 text-blue-500" />;
            return <Users className="h-3.5 w-3.5 text-muted-foreground" />;
          };

          if (viewMode === 'signal') {
            const isDiscovered = discoveredCompanies.has(company.id);
            const swipeDirection = swipingCompanies.get(company.id);
            const swipeClass = swipeDirection === 'left' 
              ? '-translate-x-full opacity-0' 
              : swipeDirection === 'right' 
              ? 'translate-x-full opacity-0' 
              : '';
            
            return (
              <Card 
                key={company.id} 
                className={`${isDiscovered ? "hover:shadow-md cursor-pointer" : ""} transition-all duration-300 ${swipeClass}`}
                onClick={isDiscovered ? () => handleCompanyClick(company) : undefined}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedCompanies.has(company.id)}
                        onCheckedChange={() => handleSelectCompany(company.id)}
                      />
                    </div>

                    {/* Bloc 1 : Logo entreprise */}
                    <div className={`flex-shrink-0 transition-all duration-500 ${!isDiscovered ? 'blur-sm select-none pointer-events-none' : ''}`}>
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Bloc 2 : Raison sociale, département, secteur */}
                    <div className={`flex-shrink-0 w-32 transition-all duration-500 ${!isDiscovered ? 'blur-sm select-none pointer-events-none' : ''}`}>
                      <h3 className="text-xs font-semibold truncate">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{company.department}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{company.sector}</span>
                      </div>
                    </div>

                    {/* Bloc 3 : Signal détecté (largeur augmentée) */}
                    <div className="flex-[2] min-w-0 px-4">
                      <div className="flex items-start gap-2">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold mb-3">Signal détecté</h4>
                          
                          <div className="flex items-center gap-6 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">Famille :</span>
                              <Badge variant="secondary" className="text-sm">
                                Appel d'offre
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">Secteur :</span>
                              <Badge variant="outline" className="text-sm">
                                {company.sector}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className={`text-sm text-muted-foreground ${expandedNews.has(company.id) ? '' : 'line-clamp-2'}`}>
                            Entreprise en forte croissance avec +25% de CA. Recherche active de solutions digitales. Projet de transformation numérique annoncé sur LinkedIn. Opportunité à saisir rapidement pour proposer nos services.
                          </p>
                          <button 
                            className="text-xs text-primary hover:underline mt-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isDiscovered) {
                                // Si l'entreprise est floutée, on agrandit juste l'actualité
                                const newExpanded = new Set(expandedNews);
                                if (expandedNews.has(company.id)) {
                                  newExpanded.delete(company.id);
                                } else {
                                  newExpanded.add(company.id);
                                }
                                setExpandedNews(newExpanded);
                              } else {
                                // Si l'entreprise est découverte, on ouvre la fiche complète
                                handleCompanyClick(company);
                              }
                            }}
                          >
                            {!isDiscovered && expandedNews.has(company.id) ? 'Afficher moins ←' : 'Afficher plus →'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bloc 4 : CA et Effectif */}
                    <div className={`flex-shrink-0 w-24 transition-all duration-500 ${!isDiscovered ? 'blur-sm select-none pointer-events-none' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {getRevenueIcon(company.ca)}
                        <span className="text-xs font-medium">
                          {(company.ca / 1000000).toFixed(1)}M€
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getHeadcountIcon(company.headcount)}
                        <span className="text-xs font-medium">
                          {company.headcount} emp.
                        </span>
                      </div>
                    </div>

                    {/* Bloc 5 : Liens */}
                    <div className={`flex-shrink-0 flex flex-col gap-1 transition-all duration-500 ${!isDiscovered ? 'blur-sm select-none pointer-events-none' : ''}`} onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" asChild className="h-7 justify-start">
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                          <ExternalLink className="h-3 w-3" />
                          <span className="text-xs">Site web</span>
                        </a>
                      </Button>
                      <Button size="sm" variant="ghost" asChild className="h-7 justify-start">
                        <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                          <Linkedin className="h-3 w-3" />
                          <span className="text-xs">LinkedIn</span>
                        </a>
                      </Button>
                    </div>

                    {/* Bloc 6 : Actions GO/NO GO ou Bouton Découvrir */}
                    {!isDiscovered ? (
                      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          size="sm" 
                          onClick={() => handleDiscover(company)}
                          className="gap-2"
                        >
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">Découvrir</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        size="sm" 
                        onClick={() => handleGo(company)}
                        className="gap-1.5 bg-success hover:bg-success/80 text-success-foreground"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span className="text-xs">GO</span>
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleNoGo(company)}
                        className="gap-1.5 bg-destructive/30 hover:bg-destructive/40 text-destructive-foreground"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        <span className="text-xs">NO GO</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          }

          const swipeDirection = swipingCompanies.get(company.id);
          const swipeClass = swipeDirection === 'left' 
            ? '-translate-x-full opacity-0' 
            : swipeDirection === 'right' 
            ? 'translate-x-full opacity-0' 
            : '';
          
          return (
            <Card 
              key={company.id} 
              className={`hover:shadow-md hover:scale-105 cursor-pointer transition-all duration-300 ${swipeClass}`}
              onClick={() => handleCompanyClick(company)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedCompanies.has(company.id)}
                      onCheckedChange={() => handleSelectCompany(company.id)}
                    />
                  </div>

                  {/* Bloc 1 : Logo entreprise */}
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Bloc 2 : Raison sociale, département, secteur */}
                  <div className="flex-shrink-0 w-48">
                    <h3 className="text-sm font-semibold truncate hover:text-primary">
                      {company.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{company.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Briefcase className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{company.sector}</span>
                    </div>
                  </div>

                  {/* Bloc 3 : Résumé */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm text-muted-foreground ${expandedSummaries.has(company.id) ? '' : 'line-clamp-3'}`}>
                      {loadingSummary && selectedCompany?.id === company.id 
                        ? 'Génération du résumé en cours...' 
                        : companySummaries.get(company.id) || company.summary || "Aucun résumé disponible. Cliquez sur 'Afficher plus' pour générer une synthèse."}
                    </p>
                    <button 
                      className="text-xs text-primary hover:underline mt-1"
                      onClick={async (e) => {
                        e.stopPropagation();
                        
                        // Si pas de résumé, le générer d'abord
                        if (!companySummaries.get(company.id)) {
                          setSelectedCompany(company);
                          setLoadingSummary(true);
                          try {
                            const generatedSummary = await companySummaryService.summarize(company);
                            setCompanySummaries(prev => new Map(prev).set(company.id, generatedSummary));
                          } catch (error) {
                            console.error('Error generating summary:', error);
                            toast({
                              title: 'Erreur',
                              description: 'Erreur lors de la génération du résumé.',
                              variant: 'destructive',
                            });
                          } finally {
                            setLoadingSummary(false);
                            setSelectedCompany(null);
                          }
                        }
                        
                        // Basculer l'affichage étendu
                        const newExpanded = new Set(expandedSummaries);
                        if (newExpanded.has(company.id)) {
                          newExpanded.delete(company.id);
                        } else {
                          newExpanded.add(company.id);
                        }
                        setExpandedSummaries(newExpanded);
                      }}
                    >
                      {expandedSummaries.has(company.id) ? 'Afficher moins ←' : 'Afficher plus →'}
                    </button>
                  </div>

                  {/* Bloc 4 : CA et Effectif */}
                  <div className="flex-shrink-0 w-32">
                    <div className="flex items-center gap-2 mb-1">
                      {getRevenueIcon(company.ca)}
                      <span className="text-xs font-medium">
                        {(company.ca / 1000000).toFixed(1)}M€
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getHeadcountIcon(company.headcount)}
                      <span className="text-xs font-medium">
                        {company.headcount} emp.
                      </span>
                    </div>
                  </div>

                  {/* Bloc 5 : Liens */}
                  <div className="flex-shrink-0 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" asChild className="h-7 justify-start">
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                        <ExternalLink className="h-3 w-3" />
                        <span className="text-xs">Site web</span>
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" asChild className="h-7 justify-start">
                      <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                        <Linkedin className="h-3 w-3" />
                        <span className="text-xs">LinkedIn</span>
                      </a>
                    </Button>
                  </div>

                  {/* Bloc 6 : Actions GO/NO GO */}
                  <div className="flex flex-col gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      size="sm" 
                      onClick={() => handleGo(company)}
                      className="gap-1.5 bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-md hover:shadow-lg transition-all"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">GO</span>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleNoGo(company)}
                      className="gap-1.5 bg-muted hover:bg-muted/80 text-muted-foreground shadow-md hover:shadow-lg transition-all border-2 border-border"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">NO GO</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Afficher:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            par page
          </span>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Modal centré pour les détails */}
      <Dialog open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <DialogOverlay className="backdrop-blur-md bg-transparent" />
        <DialogContent className="max-w-7xl max-h-[70vh] overflow-y-auto p-6">
          {selectedCompany && (
            <div className="w-full">
              {/* Disposition en 3 colonnes */}
              <div className="grid grid-cols-12 gap-6">
                {/* Colonne gauche : Carte entreprise comme dans la liste */}
                <div className="col-span-3">
                  <Card className="bg-card">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        {/* Logo */}
                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center mx-auto">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        
                        {/* Nom et localisation */}
                        <div className="text-center space-y-2">
                          <h3 className="text-base font-semibold">
                            {selectedCompany.name}
                          </h3>
                          <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              <span>{selectedCompany.department}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="h-3 w-3" />
                              <span>{selectedCompany.sector}</span>
                            </div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          <Badge className="text-xs">{selectedCompany.naf}</Badge>
                        </div>

                        {/* KPI rapides */}
                        <div className="pt-3 border-t space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              CA
                            </span>
                            <span className="font-semibold">{(selectedCompany.ca / 1000000).toFixed(1)}M€</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Effectif
                            </span>
                            <span className="font-semibold">{selectedCompany.headcount} emp.</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Colonne centrale : KPI en 2 colonnes */}
                <div className="col-span-5">
                  <h3 className="text-lg font-semibold mb-4">Informations détaillées</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Adresse</span>
                      <p className="text-sm font-medium">{selectedCompany.address}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">SIRET</span>
                      <p className="text-sm font-medium">{selectedCompany.siret}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Code NAF</span>
                      <p className="text-sm font-medium">{selectedCompany.naf}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Secteur</span>
                      <p className="text-sm font-medium">{selectedCompany.sector}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Chiffre d'affaires</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-medium">{(selectedCompany.ca / 1000000).toFixed(1)}M€</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Effectif</span>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium">{selectedCompany.headcount} employés</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Département</span>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <p className="text-sm font-medium">{selectedCompany.department}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Secteur d'activité</span>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <p className="text-sm font-medium">{selectedCompany.sector}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Site web</span>
                      <a 
                        href={selectedCompany.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visiter le site →
                      </a>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">LinkedIn</span>
                      <a 
                        href={selectedCompany.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <Linkedin className="h-3 w-3" />
                        Voir le profil →
                      </a>
                    </div>
                  </div>
                </div>

                {/* Colonne droite : Synthèse et actions */}
                <div className="col-span-4">
                  <h3 className="text-lg font-semibold mb-4">Synthèse</h3>
                  <div className="bg-muted/20 rounded-lg p-4 border border-border mb-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {loadingSummary ? 'Génération de la synthèse en cours...' : summary || 'Aucune synthèse disponible'}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-success hover:bg-success/80 text-success-foreground"
                      onClick={() => {
                        handleGo(selectedCompany);
                        navigate('/prospects');
                      }}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      GO - Ajouter aux Prospects
                    </Button>
                    <Button 
                      className="w-full bg-destructive/30 hover:bg-destructive/40 text-destructive-foreground"
                      onClick={() => handleNoGo(selectedCompany)}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      NO GO - Masquer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour sélectionner les personas */}
      <Dialog open={showPersonaDialog} onOpenChange={setShowPersonaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Générer des contacts</DialogTitle>
            <DialogDescription>
              Sélectionnez les ciblages et le nombre de contacts à générer pour {selectedCompanies.size} entreprise(s)
            </DialogDescription>
          </DialogHeader>

          {loadingPersonas ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Chargement des ciblages...</p>
            </div>
          ) : userPersonas.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Vous n'avez pas encore créé de ciblages de contacts.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPersonaDialog(false);
                  navigate('/targeting');
                }}
              >
                <Target className="h-4 w-4 mr-2" />
                Créer mes ciblages
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Ciblages de contacts
                </Label>
                {userPersonas.map((persona, index) => (
                  <div key={persona.id} className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Checkbox
                          id={persona.id}
                          checked={selectedPersonas.includes(persona.name)}
                          onCheckedChange={() => handlePersonaToggle(persona.name)}
                        />
                        <label
                          htmlFor={persona.id}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {persona.name}
                        </label>
                      </div>
                      <div className="flex gap-2 ml-6">
                        <Badge variant="outline" className="text-xs">
                          {persona.service}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {persona.decision_level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="count">Nombre de contacts par ciblage</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={10}
                  value={contactCount}
                  onChange={(e) => setContactCount(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Total : {selectedPersonas.length * contactCount} contact{selectedPersonas.length * contactCount > 1 ? 's' : ''} par entreprise
                </p>
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPersonaDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleConfirmGetContacts}>
                  Chercher les contacts
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Dialog pour confirmer la découverte */}
      <AlertDialog open={showDiscoverAlert} onOpenChange={setShowDiscoverAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Découvrir cette entreprise</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir découvrir cette entreprise ?
              <br />
              <span className="font-semibold text-foreground">8 crédits</span> seront déduits de votre solde total.
              <br />
              <span className="text-muted-foreground">Solde actuel : {credits} crédits</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDiscoverAlert(false);
              setCompanyToDiscover(null);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscover}>
              Confirmer (8 crédits)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog NO GO pour modifier le ciblage */}
      <AlertDialog open={showNoGoDialog} onOpenChange={setShowNoGoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Entreprise masquée</AlertDialogTitle>
            <AlertDialogDescription>
              Cette entreprise a été masquée et ne sera plus affichée.
              <br />
              <br />
              Souhaitez-vous affiner votre ciblage pour éviter ce type d'entreprises à l'avenir ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowNoGoDialog(false)}>
              Non, merci
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowNoGoDialog(false);
              navigate('/targeting');
            }}>
              Modifier mon ciblage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Marche;
