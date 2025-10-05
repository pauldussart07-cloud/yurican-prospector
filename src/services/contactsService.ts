import { Contact } from '@/lib/mockData';

export type PersonaType = 
  | 'Décisionnaire Commercial'
  | 'Décisionnaire Marketing'
  | 'Direction Générale'
  | 'Opérations';

export interface UserPersona {
  id: string;
  name: string;
  service: string;
  decision_level: string;
}

interface GenerateContactsParams {
  companyId: string;
  companyName: string;
  personas: PersonaType[] | UserPersona[];
  count: number;
}

const firstNames = [
  'Sophie', 'Thomas', 'Marie', 'Pierre', 'Julie', 'Laurent', 'Isabelle', 'Nicolas',
  'Camille', 'Alexandre', 'Claire', 'Julien', 'Émilie', 'François', 'Caroline',
  'Mathieu', 'Aurélie', 'Sébastien', 'Nathalie', 'Olivier', 'Céline', 'Vincent'
];

const lastNames = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy',
  'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand',
  'Roux', 'Vincent', 'Fournier', 'Girard', 'Bonnet', 'Dupont'
];

const rolesByService: Record<string, string[]> = {
  'Commerce': [
    'Directeur Commercial',
    'Directrice des Ventes',
    'Responsable Commercial',
    'Responsable Business Development',
    'Chef des Ventes',
    'Directeur Grands Comptes'
  ],
  'Marketing': [
    'Directeur Marketing',
    'Directrice de la Communication',
    'Responsable Marketing',
    'Chef de Produit',
    'Responsable Marketing Digital',
    'Community Manager'
  ],
  'Direction': [
    'CEO',
    'Directeur Général',
    'Président',
    'Directrice Générale',
    'Directeur',
    'DG Adjoint'
  ],
  'IT': [
    'Directeur Informatique',
    'CTO',
    'Responsable IT',
    'Chef de Projet IT',
    'Architecte Technique'
  ],
  'RH': [
    'Directeur RH',
    'Responsable Recrutement',
    'DRH',
    'Chargé RH',
    'Responsable Formation'
  ],
  'Finance': [
    'Directeur Financier',
    'CFO',
    'Responsable Comptabilité',
    'Contrôleur de Gestion',
    'DAF'
  ],
  'Production': [
    'Directeur de Production',
    'Responsable Qualité',
    'Chef d\'Atelier',
    'Responsable Production',
    'Directeur Technique'
  ],
  'Logistique': [
    'Directeur Logistique',
    'Responsable Supply Chain',
    'Chef de Quai',
    'Responsable Entrepôt',
    'Supply Chain Manager'
  ]
};

const seniorityByDecisionLevel: Record<string, string> = {
  'Décisionnaire': 'Senior',
  'Influenceur': 'Mid-Level',
  'Utilisateur': 'Junior'
};

const getDefaultSeniority = (decisionLevel?: string): string => {
  return decisionLevel && seniorityByDecisionLevel[decisionLevel] 
    ? seniorityByDecisionLevel[decisionLevel] 
    : 'Senior';
};

const domainByPersona: Record<PersonaType, string> = {
  'Décisionnaire Commercial': 'Commercial',
  'Décisionnaire Marketing': 'Marketing',
  'Direction Générale': 'Direction',
  'Opérations': 'Opérations'
};

/**
 * Service mock pour générer des contacts
 * Simule une API de génération de contacts
 */
export const contactsService = {
  async generateContacts(params: GenerateContactsParams): Promise<Contact[]> {
    const { companyId, companyName, personas, count } = params;

    // Simuler une latence réseau (400-800ms)
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));

    const contacts: Contact[] = [];
    const emailDomain = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');

    for (let i = 0; i < count; i++) {
      const persona = personas[i % personas.length];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      // Déterminer le service et le niveau de décision
      let service: string;
      let decisionLevel: string | undefined;
      let personaName: string;
      
      if (typeof persona === 'string') {
        // Ancien format avec PersonaType
        service = domainByPersona[persona as PersonaType] || 'Commerce';
        personaName = persona;
      } else {
        // Nouveau format avec UserPersona
        service = persona.service;
        decisionLevel = persona.decision_level;
        personaName = persona.name;
      }
      
      // Obtenir les rôles possibles pour ce service
      const roles = rolesByService[service] || rolesByService['Commerce'];
      const role = roles[Math.floor(Math.random() * roles.length)];
      
      const contact: Contact = {
        id: `c-${Date.now()}-${i}`,
        companyId,
        fullName: `${firstName} ${lastName}`,
        role,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}.fr`,
        phone: `+33 ${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`,
        seniority: getDefaultSeniority(decisionLevel),
        domain: service,
        source: Math.random() > 0.5 ? 'LinkedIn' : 'Website',
        createdAt: new Date(),
      };

      contacts.push(contact);
    }

    return contacts;
  }
};
