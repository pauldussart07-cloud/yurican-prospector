-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create enum for persona services
CREATE TYPE public.persona_service AS ENUM ('Commerce', 'Marketing', 'IT', 'RH', 'Direction', 'Finance', 'Production', 'Logistique');

-- Create enum for decision levels
CREATE TYPE public.decision_level AS ENUM ('Décisionnaire', 'Influenceur', 'Utilisateur');

-- Create table for targeting configurations (ciblages)
CREATE TABLE public.targetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Targeting criteria
  departments TEXT[], -- French departments (75, 69, etc.)
  sectors TEXT[], -- Activity sectors
  min_headcount INTEGER,
  max_headcount INTEGER,
  min_revenue BIGINT, -- in euros
  max_revenue BIGINT,
  
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for personas
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  service persona_service NOT NULL,
  decision_level decision_level NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, name)
);

-- Create table for user credits
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  credits INTEGER DEFAULT 100,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.targetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for targetings
CREATE POLICY "Users can view their own targetings"
  ON public.targetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own targetings"
  ON public.targetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own targetings"
  ON public.targetings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own targetings"
  ON public.targetings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for personas
CREATE POLICY "Users can view their own personas"
  ON public.personas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own personas"
  ON public.personas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personas"
  ON public.personas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personas"
  ON public.personas FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on targetings
CREATE TRIGGER update_targetings_updated_at
  BEFORE UPDATE ON public.targetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on personas
CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on user_credits
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();