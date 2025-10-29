-- Add juz column to favorite_bookmarks table
ALTER TABLE favorite_bookmarks
ADD COLUMN IF NOT EXISTS juz INT;

-- Add index for juz column
CREATE INDEX IF NOT EXISTS idx_favorite_bookmarks_juz ON favorite_bookmarks(user_id, juz);

-- Update existing bookmarks with juz information (optional)
-- This will be handled by the application when users interact with existing bookmarks
