-- Create sequence_enrollments table to track contacts in sequences
CREATE TABLE public.sequence_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.lead_contacts(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence_analytics table to track opens and replies
CREATE TABLE public.sequence_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.sequence_steps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add whatsapp_message column to sequence_steps
ALTER TABLE public.sequence_steps 
ADD COLUMN whatsapp_message TEXT,
ADD COLUMN whatsapp_audio_url TEXT;

-- Enable RLS on sequence_enrollments
ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view enrollments of their sequences"
ON public.sequence_enrollments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM sequences 
  WHERE sequences.id = sequence_enrollments.sequence_id 
  AND sequences.user_id = auth.uid()
));

CREATE POLICY "Users can create enrollments for their sequences"
ON public.sequence_enrollments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM sequences 
  WHERE sequences.id = sequence_enrollments.sequence_id 
  AND sequences.user_id = auth.uid()
));

CREATE POLICY "Users can update enrollments of their sequences"
ON public.sequence_enrollments FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM sequences 
  WHERE sequences.id = sequence_enrollments.sequence_id 
  AND sequences.user_id = auth.uid()
));

CREATE POLICY "Users can delete enrollments of their sequences"
ON public.sequence_enrollments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM sequences 
  WHERE sequences.id = sequence_enrollments.sequence_id 
  AND sequences.user_id = auth.uid()
));

-- Enable RLS on sequence_analytics
ALTER TABLE public.sequence_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics of their sequences"
ON public.sequence_analytics FOR SELECT
USING (EXISTS (
  SELECT 1 FROM sequences 
  WHERE sequences.id = sequence_analytics.sequence_id 
  AND sequences.user_id = auth.uid()
));

CREATE POLICY "Users can create analytics for their sequences"
ON public.sequence_analytics FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM sequences 
  WHERE sequences.id = sequence_analytics.sequence_id 
  AND sequences.user_id = auth.uid()
));

-- Create triggers for updated_at
CREATE TRIGGER update_sequence_enrollments_updated_at
BEFORE UPDATE ON public.sequence_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_sequence_enrollments_sequence_id ON public.sequence_enrollments(sequence_id);
CREATE INDEX idx_sequence_enrollments_contact_id ON public.sequence_enrollments(contact_id);
CREATE INDEX idx_sequence_analytics_sequence_id ON public.sequence_analytics(sequence_id);
CREATE INDEX idx_sequence_analytics_event_type ON public.sequence_analytics(event_type);