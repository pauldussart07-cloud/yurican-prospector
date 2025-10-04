import { Contact } from '@/lib/mockData';

export type PersonaType = 
  | 'Décisionnaire Commercial'
  | 'Décisionnaire Marketing'
  | 'Direction Générale'
  | 'Opérations';

interface GenerateContactsParams {
  companyId: string;
  companyName: string;
  personas: PersonaType[];
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

const rolesByPersona: Record<PersonaType, string[]> = {
  'Décisionnaire Commercial': [
    'Directeur Commercial',
    'Directrice des Ventes',
    'Responsable Business Development',
    'VP Sales',
    'Directeur Grands Comptes'
  ],
  'Décisionnaire Marketing': [
    'Directeur Marketing',
    'Directrice de la Communication',
    'CMO',
    'Responsable Marketing Digital',
    'VP Marketing'
  ],
  'Direction Générale': [
    'CEO',
    'Directeur Général',
    'Président',
    'Directrice Générale',
    'COO'
  ],
  'Opérations': [
    'Directeur des Opérations',
    'COO',
    'Responsable Production',
    'Directrice Technique',
    'VP Operations'
  ]
};

const seniorityByPersona: Record<PersonaType, string> = {
  'Décisionnaire Commercial': 'Senior',
  'Décisionnaire Marketing': 'Senior',
  'Direction Générale': 'C-Level',
  'Opérations': 'Senior'
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
      const roles = rolesByPersona[persona];
      const role = roles[Math.floor(Math.random() * roles.length)];
      
      const contact: Contact = {
        id: `c-${Date.now()}-${i}`,
        companyId,
        fullName: `${firstName} ${lastName}`,
        role,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}.fr`,
        phone: `+33 ${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`,
        seniority: seniorityByPersona[persona],
        domain: domainByPersona[persona],
        source: Math.random() > 0.5 ? 'LinkedIn' : 'Website',
        createdAt: new Date(),
      };

      contacts.push(contact);
    }

    return contacts;
  }
};
