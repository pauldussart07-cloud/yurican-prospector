// Utilitaire pour générer des entreprises
import { supabase } from '@/integrations/supabase/client';

const sectors = [
  'Technologie et Numérique',
  'Services aux Entreprises',
  'Commerce et Distribution',
  'BTP et Construction',
  'Industrie',
  'Transport et Logistique',
  'Agriculture et Agroalimentaire',
  'Tourisme et Hôtellerie',
  'Éducation et Formation',
  'Énergie et Environnement',
  'Santé et Pharmaceutique',
  'Finance et Assurance',
];

const departments = [
  '75', '69', '13', '31', '44', '33', '67', '06', '35', '51',
  '38', '21', '14', '37', '45', '49', '25', '87', '72', '86',
  '59', '76', '34', '63', '76', '80', '62', '54', '57', '68',
  '88', '08', '10', '52', '55', '28', '41', '18', '36', '03',
];

const cities = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nantes', 'Bordeaux', 'Strasbourg',
  'Nice', 'Rennes', 'Reims', 'Grenoble', 'Dijon', 'Caen', 'Tours', 'Orléans',
  'Angers', 'Besançon', 'Limoges', 'Le Mans', 'Poitiers', 'Lille', 'Rouen',
  'Montpellier', 'Clermont-Ferrand', 'Le Havre', 'Amiens', 'Lens', 'Nancy',
  'Metz', 'Mulhouse', 'Épinal', 'Charleville-Mézières', 'Troyes', 'Chaumont',
];

const companyPrefixes = [
  'Tech', 'Digital', 'Innov', 'Smart', 'Pro', 'Expert', 'Solutions', 'Conseil',
  'Agence', 'Groupe', 'Société', 'Entreprise', 'Services', 'Distribution',
  'Construction', 'Industrie', 'Transport', 'Logistique', 'Commerce', 'Retail',
  'Data', 'Cloud', 'AI', 'Green', 'Eco', 'Bio', 'Santé', 'Med', 'Pharma',
];

const companySuffixes = [
  'Plus', 'Pro', 'Expert', 'Solutions', 'Services', 'France', 'Europe', 
  'Consulting', 'Group', 'Tech', 'Digital', 'Innovation', 'Systems', 'Corp',
];

function generateCompanyName(city: string): string {
  const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
  const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
  return `${prefix}${suffix} ${city}`;
}

function generateSiret(): string {
  const part1 = Math.floor(100 + Math.random() * 900);
  const part2 = Math.floor(100 + Math.random() * 900);
  const part3 = Math.floor(100 + Math.random() * 900);
  const part4 = Math.floor(100 + Math.random() * 900);
  return `${part1} ${part2} ${part3} 00${part4}`;
}

function generateNaf(): string {
  const codes = ['6201Z', '6202A', '6311Z', '4711D', '4120A', '5229A', '3511Z', '5510Z', '8559A', '2561Z'];
  return codes[Math.floor(Math.random() * codes.length)];
}

function generateSignalSummary(): string {
  const signals = [
    'Lancement d\'un nouveau projet de transformation digitale',
    'Recherche active de solutions pour améliorer la productivité',
    'Expansion géographique prévue dans les 6 prochains mois',
    'Augmentation significative du budget IT',
    'Recrutement massif en cours',
    'Nouvelle direction commerciale en place',
    'Levée de fonds récente de plusieurs millions',
    'Partenariat stratégique annoncé publiquement',
  ];
  return signals[Math.floor(Math.random() * signals.length)];
}

export async function generateAndInsertCompanies(count: number, hotSignalCount: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const companies = [];
  
  for (let i = 0; i < count; i++) {
    const cityIndex = Math.floor(Math.random() * cities.length);
    const city = cities[cityIndex];
    const department = departments[cityIndex] || '75';
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const isHotSignal = i < hotSignalCount;
    
    const company = {
      user_id: user.id,
      company_id: `gen-${Date.now()}-${i}`,
      company_name: generateCompanyName(city),
      company_sector: sector,
      company_department: department,
      company_ca: Math.floor(1000000 + Math.random() * 50000000),
      company_headcount: Math.floor(10 + Math.random() * 500),
      company_website: `https://${generateCompanyName(city).toLowerCase().replace(/ /g, '')}.fr`,
      company_linkedin: `https://linkedin.com/company/${generateCompanyName(city).toLowerCase().replace(/ /g, '')}`,
      company_address: `${Math.floor(1 + Math.random() * 200)} rue de la République, ${department}000 ${city}`,
      company_siret: generateSiret(),
      company_naf: generateNaf(),
      status: 'Nouveau',
      is_hot_signal: isHotSignal,
      signal_summary: isHotSignal ? generateSignalSummary() : null,
    };
    
    companies.push(company);
  }

  // Insérer par lots de 10
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('leads')
      .upsert(batch, { onConflict: 'user_id,company_id' })
      .select();
    
    if (error) {
      console.error('Error inserting batch:', error);
      throw error;
    }
    
    if (data) {
      results.push(...data);
    }
  }

  return results;
}
