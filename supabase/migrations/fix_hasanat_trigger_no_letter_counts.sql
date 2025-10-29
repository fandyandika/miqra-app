-- Fix hasanat trigger to not use letter_counts table
-- Since we're using JSON client-side, the trigger should just pass through
-- the values that are already calculated by the client

BEGIN;

-- Drop the old trigger
DROP TRIGGER IF EXISTS set_session_hasanat_biu ON public.reading_sessions;

-- Drop the old function that queries letter_counts
DROP FUNCTION IF EXISTS public.tg_set_session_hasanat();

-- Drop the sum_letters function that queries letter_counts
DROP FUNCTION IF EXISTS public.sum_letters(INT, INT, INT);

-- Create a simple pass-through trigger function
-- (This does nothing since client already calculates hasanat)
CREATE OR REPLACE FUNCTION public.tg_set_session_hasanat()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Client already sets letter_count and hasanat_earned
  -- Just pass through the values
  RETURN NEW;
END;
$$;

-- Re-create the trigger
CREATE TRIGGER set_session_hasanat_biu
BEFORE INSERT OR UPDATE ON public.reading_sessions
FOR EACH ROW
EXECUTE FUNCTION public.tg_set_session_hasanat();

COMMIT;

