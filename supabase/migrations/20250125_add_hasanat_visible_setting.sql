-- Add hasanat_visible setting to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hasanat_visible BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.profiles.hasanat_visible IS 'Whether user wants to see hasanat features in UI';

-- Update existing users to have hasanat_visible = false by default
UPDATE public.profiles
SET hasanat_visible = false
WHERE hasanat_visible IS NULL;
