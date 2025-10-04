import { Company } from '@/lib/mockData';

/**
 * Service mock pour l'API SocieteInfo
 * Prêt à être remplacé par de vrais appels API
 */
export const societeInfoService = {
  async searchCompanyByName(name: string): Promise<Company[]> {
    // Simuler une latence réseau (300-600ms)
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

    // TODO: Remplacer par un vrai appel API
    console.warn('societeInfoService.searchCompanyByName: Using mock data');
    
    return [];
  },

  async getCompanyBySiret(siret: string): Promise<Company | null> {
    // Simuler une latence réseau (300-600ms)
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

    // TODO: Remplacer par un vrai appel API
    console.warn('societeInfoService.getCompanyBySiret: Using mock data');
    
    return null;
  }
};
