-- Create a table for contact activities
CREATE TABLE public.contact_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('note', 'action', 'status_change', 'meeting')),
  activity_description TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own contact activities" 
ON public.contact_activities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact activities" 
ON public.contact_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact activities" 
ON public.contact_activities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact activities" 
ON public.contact_activities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_contact_activities_contact_id ON public.contact_activities(contact_id);
CREATE INDEX idx_contact_activities_lead_id ON public.contact_activities(lead_id);
CREATE INDEX idx_contact_activities_created_at ON public.contact_activities(created_at DESC);