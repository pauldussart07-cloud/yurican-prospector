-- Add position column to personas table for drag and drop ordering
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Create index for better performance on position queries
CREATE INDEX IF NOT EXISTS idx_personas_position ON public.personas(user_id, position);