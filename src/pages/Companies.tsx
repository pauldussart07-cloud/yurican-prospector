import { useState, useMemo, useEffect } from 'react';
import { Building2, ExternalLink, Linkedin, FileText, ThumbsUp, ThumbsDown, Users, TrendingUp, MapPin, Contact, DollarSign, Briefcase, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { mockCompanies, Company, mockLeads, Lead } from '@/lib/mockData';
import { companySummaryService } from '@/services/companySummaryService';
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

const Companies = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeTargeting } = useTargeting();
  const [companies, setCompanies] = useState(mockCompanies);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  
  // Filtres
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
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

  const handleCompanyClick = async (company: Company) => {
    // En mode signal, vérifier si l'entreprise a été découverte
    if (viewMode === 'signal' && !discoveredCompanies.has(company.id)) {
      return;
    }
    
    setSelectedCompany(company);
    setSummary('');
    setLoadingSummary(true);
    
    try {
      const generatedSummary = await companySummaryService.summarize(company);
      setSummary(generatedSummary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Erreur lors de la génération du résumé.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleDiscover = async (company: Company) => {
    // Marquer comme découverte
    setDiscoveredCompanies(prev => new Set(prev).add(company.id));
    // Ouvrir la fiche
    await handleCompanyClick(company);
  };

  const handleGo = (company: Company) => {
    // Créer ou mettre à jour un lead
    const existingLead = leads.find(l => l.companyId === company.id);
    
    if (!existingLead) {
      const newLead: Lead = {
        id: `l-${Date.now()}`,
        companyId: company.id,
        status: 'New',
        contactsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setLeads([...leads, newLead]);
    }
    
    toast({
      title: 'Entreprise ajoutée aux leads',
      description: `${company.name} a été ajouté à votre pipeline.`,
    });
    
    setSelectedCompany(null);
  };

  const handleNoGo = (company: Company) => {
    setCompanies(companies.map(c => 
      c.id === company.id ? { ...c, isHidden: true } : c
    ));
    
    toast({
      title: 'Entreprise masquée',
      description: `${company.name} ne sera plus affichée.`,
      variant: 'destructive',
    });
    
    setSelectedCompany(null);
  };

  // Filtrer et trier les entreprises avec le ciblage actif
  const filteredCompanies = useMemo(() => {
    let filtered = companies.filter(c => !hideNoGo || !c.isHidden);

    // Apply targeting filter if active
    if (activeTargeting) {
      filtered = filtered.filter(c => {
        // Filter by departments
        if (activeTargeting.departments.length > 0 && !activeTargeting.departments.includes(c.department)) {
          return false;
        }
        
        // Filter by sectors
        if (activeTargeting.sectors.length > 0 && !activeTargeting.sectors.some(s => c.sector.toLowerCase().includes(s.toLowerCase()))) {
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
  }, [companies, hideNoGo, activeTargeting, departmentFilter, sortCriteria, sortDirection]);

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

  const handleGetContacts = (personaId: string) => {
    const personaName = personas.find(p => p.id === personaId)?.name;
    toast({
      title: 'Récupération des contacts',
      description: `Récupération des contacts "${personaName}" pour ${selectedCompanies.size} entreprise(s)...`,
    });
    setSelectedCompanies(new Set());
  };

  const departments = Array.from(new Set(companies.map(c => c.department))).sort();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Entreprises</h1>
        <div className="text-sm text-muted-foreground">
          {filteredCompanies.length} entreprise{filteredCompanies.length > 1 ? 's' : ''}
        </div>
      </div>


      {/* Liste des entreprises */}
      <div className="space-y-3">
        {/* Header avec checkbox select all et actions */}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <Contact className="h-4 w-4 mr-2" />
                      Récupérer des contacts
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {personas.length === 0 ? (
                      <DropdownMenuItem disabled>
                        Aucun ciblage contact configuré
                      </DropdownMenuItem>
                    ) : (
                      personas.map((persona) => (
                        <DropdownMenuItem
                          key={persona.id}
                          onClick={() => handleGetContacts(persona.id)}
                        >
                          {persona.name} ({selectedCompanies.size} contacts)
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  variant={hideNoGo ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHideNoGo(!hideNoGo)}
                >
                  {hideNoGo ? 'NO GO masqués' : 'Afficher NO GO'}
                </Button>
              </>
            )}
          </div>
        </div>

        {paginatedCompanies.map((company) => {
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
            return (
              <Card 
                key={company.id} 
                className={isDiscovered ? "hover:shadow-md transition-shadow cursor-pointer" : "transition-shadow"}
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

                    {/* Bloc 1 : Logo entreprise (grisé) */}
                    <div className="flex-shrink-0 blur-sm select-none pointer-events-none">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Bloc 2 : Raison sociale, département, secteur (grisé) */}
                    <div className="flex-shrink-0 w-32 blur-sm select-none pointer-events-none">
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
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            Entreprise en forte croissance avec +25% de CA. Recherche active de solutions digitales. Projet de transformation numérique annoncé sur LinkedIn. Opportunité à saisir rapidement pour proposer nos services.
                          </p>
                          <button 
                            className="text-xs text-primary hover:underline mt-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompanyClick(company);
                            }}
                          >
                            Afficher plus →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bloc 4 : CA et Effectif (grisé) */}
                    <div className="flex-shrink-0 w-24 blur-sm select-none pointer-events-none">
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

                    {/* Bloc 5 : Liens (grisé) */}
                    <div className="flex-shrink-0 flex flex-col gap-1 blur-sm select-none pointer-events-none">
                      <Button size="sm" variant="ghost" className="h-7 justify-start">
                        <ExternalLink className="h-3 w-3 mr-1.5" />
                        <span className="text-xs">Site web</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 justify-start">
                        <Linkedin className="h-3 w-3 mr-1.5" />
                        <span className="text-xs">LinkedIn</span>
                      </Button>
                    </div>

                    {/* Bloc 6 : Bouton Découvrir */}
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
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card 
              key={company.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
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
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {company.summary || "Aucun résumé disponible. Cliquez pour générer une synthèse détaillée de cette entreprise."}
                    </p>
                    <button 
                      className="text-xs text-primary hover:underline mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompanyClick(company);
                      }}
                    >
                      Afficher plus →
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
                      className="gap-1.5 bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span className="text-xs">GO</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleNoGo(company)}
                      className="gap-1.5"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span className="text-xs">NO GO</span>
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
                    
                    <div className="col-span-2">
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
                    
                    <div className="col-span-2">
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
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleGo(selectedCompany)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      GO - Ajouter aux Leads
                    </Button>
                    <Button 
                      variant="destructive"
                      className="w-full"
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
    </div>
  );
};

export default Companies;
