-- Add date validation constraint to prevent future dates
ALTER TABLE public.checkins 
ADD CONSTRAINT checkins_date_not_future 
CHECK (date <= CURRENT_DATE);

-- Add date validation constraint to reading_sessions
ALTER TABLE public.reading_sessions 
ADD CONSTRAINT reading_sessions_date_not_future 
CHECK (date <= CURRENT_DATE);
