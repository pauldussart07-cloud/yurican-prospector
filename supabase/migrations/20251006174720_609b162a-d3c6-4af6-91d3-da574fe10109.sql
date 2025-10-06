-- Migration pour aligner les enums avec les valeurs de l'onboarding

-- Étape 1: Modifier les colonnes en TEXT d'abord
ALTER TABLE public.personas 
  ALTER COLUMN decision_level TYPE TEXT,
  ALTER COLUMN service TYPE TEXT;

-- Étape 2: Mettre à jour les données existantes
-- Migrer decision_level
UPDATE public.personas 
SET decision_level = 'Dirigeant' 
WHERE decision_level = 'Décisionnaire';

UPDATE public.personas 
SET decision_level = 'Directeur / Responsable' 
WHERE decision_level = 'Influenceur';

UPDATE public.personas 
SET decision_level = 'Autres collaborateurs' 
WHERE decision_level = 'Utilisateur';

-- Migrer persona_service
UPDATE public.personas 
SET service = 'Comptabilité / Finance' 
WHERE service = 'Finance';

-- Étape 3: Supprimer les anciens types enum
DROP TYPE IF EXISTS public.decision_level CASCADE;
DROP TYPE IF EXISTS public.persona_service CASCADE;

-- Étape 4: Créer les nouveaux types enum avec les bonnes valeurs
CREATE TYPE public.decision_level AS ENUM (
  'Dirigeant',
  'Directeur / Responsable',
  'Autres collaborateurs'
);

CREATE TYPE public.persona_service AS ENUM (
  'Direction',
  'Commerce',
  'Marketing',
  'Comptabilité / Finance',
  'IT',
  'RH',
  'Juridique',
  'R&D',
  'Production',
  'Logistique'
);

-- Étape 5: Reconvertir les colonnes en types enum
ALTER TABLE public.personas 
  ALTER COLUMN decision_level TYPE public.decision_level USING decision_level::public.decision_level,
  ALTER COLUMN service TYPE public.persona_service USING service::public.persona_service;