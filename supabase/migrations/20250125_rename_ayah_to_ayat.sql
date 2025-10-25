BEGIN;

-- Rename column ayah to ayat for consistency with other tables
ALTER TABLE public.letter_counts
  RENAME COLUMN ayah TO ayat;

-- Create index for fast lookup performance
CREATE INDEX IF NOT EXISTS idx_letter_counts_surah_ayat
  ON public.letter_counts (surah, ayat);

-- Optional: compatibility view (delete later after code migration)
CREATE OR REPLACE VIEW public.letter_counts_compat AS
SELECT
  surah,
  ayat AS ayah,
  letters
FROM public.letter_counts;

COMMIT;
