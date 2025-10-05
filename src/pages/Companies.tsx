import { useState, useMemo, useEffect } from 'react';
import { Building2, ExternalLink, Linkedin, FileText, ThumbsUp, ThumbsDown, Users, TrendingUp, MapPin, Contact } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [hideNoGo, setHideNoGo] = useState(true);

  // Pagination et sélection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [personas, setPersonas] = useState<Persona[]>([]);

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
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
  }, [companies, hideNoGo, activeTargeting, departmentFilter, sortOrder]);

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
      {/* Bandeau d'action quand des entreprises sont sélectionnées */}
      {selectedCompanies.size > 0 && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedCompanies.size} entreprise(s) sélectionnée(s)
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
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
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCompanies(new Set())}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Entreprises</h1>
        <div className="text-sm text-muted-foreground">
          {filteredCompanies.length} entreprise{filteredCompanies.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">A → Z</SelectItem>
                <SelectItem value="desc">Z → A</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={hideNoGo ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHideNoGo(!hideNoGo)}
            >
              {hideNoGo ? 'NO GO masqués' : 'Afficher NO GO'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des entreprises */}
      <div className="space-y-3">
        {/* Header avec checkbox select all */}
        <div className="flex items-center gap-3 px-4">
          <Checkbox
            checked={selectedCompanies.size === paginatedCompanies.length && paginatedCompanies.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            Tout sélectionner
          </span>
        </div>

        {paginatedCompanies.map((company) => (
          <Card 
            key={company.id} 
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <Checkbox
                  checked={selectedCompanies.has(company.id)}
                  onCheckedChange={() => handleSelectCompany(company.id)}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Logo */}
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Informations principales */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-base font-semibold hover:text-primary cursor-pointer truncate"
                        onClick={() => handleCompanyClick(company)}
                      >
                        {company.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {company.department}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{company.sector}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{company.headcount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{(company.ca / 1000000).toFixed(1)}M€</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" asChild>
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={company.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleCompanyClick(company)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleGo(company)}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleNoGo(company)}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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

      {/* Drawer latéral pour les détails */}
      <Sheet open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedCompany && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{selectedCompany.name}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge>{selectedCompany.naf}</Badge>
                      <Badge variant="outline">{selectedCompany.sector}</Badge>
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* KPI Société */}
                <div>
                  <h3 className="font-semibold mb-3">Informations</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adresse</span>
                      <span className="font-medium text-right">{selectedCompany.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SIRET</span>
                      <span className="font-medium">{selectedCompany.siret}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Code NAF</span>
                      <span className="font-medium">{selectedCompany.naf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chiffre d'affaires</span>
                      <span className="font-medium">{(selectedCompany.ca / 1000000).toFixed(1)}M€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Effectif</span>
                      <span className="font-medium">{selectedCompany.headcount} employés</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Site web</span>
                      <a 
                        href={selectedCompany.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        Visiter →
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">LinkedIn</span>
                      <a 
                        href={selectedCompany.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        Voir le profil →
                      </a>
                    </div>
                  </div>
                </div>

                {/* Synthèse */}
                <div>
                  <h3 className="font-semibold mb-3">Synthèse</h3>
                  <Textarea 
                    value={loadingSummary ? 'Génération de la synthèse...' : summary}
                    readOnly
                    className="min-h-32 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1"
                    onClick={() => handleGo(selectedCompany)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Ajouter aux Leads (GO)
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleNoGo(selectedCompany)}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Masquer (NO GO)
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Companies;
