-- Add engagement_date column to lead_contacts table
ALTER TABLE public.lead_contacts 
ADD COLUMN engagement_date date DEFAULT CURRENT_DATE;