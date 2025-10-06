-- Create table for job functions
CREATE TABLE public.job_functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_functions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read job functions (public reference data)
CREATE POLICY "Job functions are viewable by everyone"
ON public.job_functions
FOR SELECT
USING (true);

-- Insert some common job functions
INSERT INTO public.job_functions (name, category) VALUES
  ('Directeur Commercial', 'Direction'),
  ('Directeur Marketing', 'Direction'),
  ('Directeur Général', 'Direction'),
  ('Sales Manager', 'Commerce'),
  ('Account Manager', 'Commerce'),
  ('Business Developer', 'Commerce'),
  ('Commercial', 'Commerce'),
  ('Responsable Marketing', 'Marketing'),
  ('Chef de Produit', 'Marketing'),
  ('Content Manager', 'Marketing'),
  ('Responsable Communication', 'Marketing'),
  ('Customer Success Manager', 'Service Client'),
  ('Support Client', 'Service Client');