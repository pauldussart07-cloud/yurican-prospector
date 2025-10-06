-- Add persona_position column to lead_contacts table to track which persona position (Top 1, 2, 3) each contact corresponds to
ALTER TABLE public.lead_contacts 
ADD COLUMN persona_position integer NULL;

-- Add check constraint to ensure position is between 1 and 10
ALTER TABLE public.lead_contacts 
ADD CONSTRAINT lead_contacts_persona_position_check 
CHECK (persona_position IS NULL OR (persona_position >= 1 AND persona_position <= 10));