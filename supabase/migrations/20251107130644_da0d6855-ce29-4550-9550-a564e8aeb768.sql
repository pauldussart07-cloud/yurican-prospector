-- Create sequences table
CREATE TABLE public.sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

-- Create policies for sequences
CREATE POLICY "Users can view their own sequences" 
ON public.sequences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sequences" 
ON public.sequences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequences" 
ON public.sequences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sequences" 
ON public.sequences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create sequence_steps table
CREATE TABLE public.sequence_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('email', 'whatsapp', 'linkedin')),
  delay_value INTEGER DEFAULT 0,
  delay_unit TEXT DEFAULT 'days' CHECK (delay_unit IN ('minutes', 'hours', 'days')),
  email_subject TEXT,
  email_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;

-- Create policies for sequence_steps
CREATE POLICY "Users can view steps of their sequences" 
ON public.sequence_steps 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.sequences
    WHERE sequences.id = sequence_steps.sequence_id
    AND sequences.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create steps for their sequences" 
ON public.sequence_steps 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sequences
    WHERE sequences.id = sequence_steps.sequence_id
    AND sequences.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update steps of their sequences" 
ON public.sequence_steps 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.sequences
    WHERE sequences.id = sequence_steps.sequence_id
    AND sequences.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete steps of their sequences" 
ON public.sequence_steps 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.sequences
    WHERE sequences.id = sequence_steps.sequence_id
    AND sequences.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates on sequences
CREATE TRIGGER update_sequences_updated_at
BEFORE UPDATE ON public.sequences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on sequence_steps
CREATE TRIGGER update_sequence_steps_updated_at
BEFORE UPDATE ON public.sequence_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();