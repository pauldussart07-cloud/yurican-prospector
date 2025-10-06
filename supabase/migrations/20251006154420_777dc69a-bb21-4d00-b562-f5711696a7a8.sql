-- Create table for sectors
CREATE TABLE public.sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read sectors (public reference data)
CREATE POLICY "Sectors are viewable by everyone"
ON public.sectors
FOR SELECT
USING (true);

-- Insert common French sectors
INSERT INTO public.sectors (name, category) VALUES
  ('Automobile', 'Industrie'),
  ('Aéronautique', 'Industrie'),
  ('Industrie pharmaceutique', 'Santé'),
  ('Biotechnologie', 'Santé'),
  ('Technologies de l''information', 'Tech'),
  ('Logiciels et SaaS', 'Tech'),
  ('E-commerce', 'Commerce'),
  ('Distribution', 'Commerce'),
  ('Banque', 'Finance'),
  ('Assurance', 'Finance'),
  ('Immobilier', 'Immobilier'),
  ('Construction', 'BTP'),
  ('Énergie', 'Industrie'),
  ('Télécommunications', 'Tech'),
  ('Transport et logistique', 'Services'),
  ('Hôtellerie et restauration', 'Services'),
  ('Éducation et formation', 'Éducation'),
  ('Conseil', 'Services'),
  ('Marketing et publicité', 'Services'),
  ('Agroalimentaire', 'Industrie');