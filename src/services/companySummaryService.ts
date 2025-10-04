import { Company } from '@/lib/mockData';

/**
 * Service mock pour générer des résumés d'entreprise
 * Simule une latence d'API réelle
 */
export const companySummaryService = {
  async summarize(company: Company): Promise<string> {
    // Simuler une latence réseau (300-600ms)
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

    // Générer un résumé basique basé sur les données
    const summaries = [
      `${company.name} est une entreprise spécialisée dans ${company.sector.toLowerCase()}, située dans le département ${company.department}. Avec un effectif de ${company.headcount} employés et un chiffre d'affaires de ${(company.ca / 1000000).toFixed(1)}M€, l'entreprise se positionne comme un acteur dynamique de son secteur. Leur expertise en ${company.sector.toLowerCase()} leur permet d'accompagner leurs clients dans leur transformation digitale.`,
      
      `Leader dans le domaine de ${company.sector.toLowerCase()}, ${company.name} compte ${company.headcount} collaborateurs et réalise un CA de ${(company.ca / 1000000).toFixed(1)}M€. Basée dans le ${company.department}, l'entreprise développe des solutions innovantes pour répondre aux besoins du marché. Leur approche centrée sur l'innovation en fait un partenaire de choix pour les projets stratégiques.`,
      
      `${company.name} (${company.headcount} employés, ${(company.ca / 1000000).toFixed(1)}M€ de CA) est une entreprise reconnue dans ${company.sector.toLowerCase()}. Implantée dans le département ${company.department}, elle accompagne ses clients dans leurs projets de transformation. Son expertise technique et sa connaissance du marché lui permettent de proposer des solutions adaptées aux enjeux actuels.`,
    ];

    return summaries[Math.floor(Math.random() * summaries.length)];
  }
};
