-- Add sender_email column to sequence_steps
ALTER TABLE public.sequence_steps 
ADD COLUMN sender_email TEXT;