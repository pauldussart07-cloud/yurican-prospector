-- Créer une table pour les leads (entreprises prospectées)
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_sector TEXT,
  company_department TEXT,
  company_ca BIGINT,
  company_headcount INTEGER,
  company_website TEXT,
  company_linkedin TEXT,
  company_address TEXT,
  company_siret TEXT,
  company_naf TEXT,
  status TEXT NOT NULL DEFAULT 'Nouveau',
  is_hot_signal BOOLEAN DEFAULT FALSE,
  signal_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Créer une table pour les contacts associés aux leads
CREATE TABLE public.lead_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  status TEXT NOT NULL DEFAULT 'Nouveau',
  note TEXT,
  follow_up_date DATE,
  is_phone_discovered BOOLEAN DEFAULT FALSE,
  is_email_discovered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur les deux tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_contacts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour leads
CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques RLS pour lead_contacts
CREATE POLICY "Users can view their own lead contacts"
  ON public.lead_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lead contacts"
  ON public.lead_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead contacts"
  ON public.lead_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead contacts"
  ON public.lead_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at sur leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour updated_at sur lead_contacts
CREATE TRIGGER update_lead_contacts_updated_at
  BEFORE UPDATE ON public.lead_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();