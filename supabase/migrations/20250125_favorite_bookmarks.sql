-- Create favorite bookmarks table
CREATE TABLE IF NOT EXISTS favorite_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_number INT NOT NULL,
  ayat_number INT NOT NULL,
  folder_name VARCHAR(50) NOT NULL DEFAULT 'Favorit',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique bookmark per user
  UNIQUE(user_id, surah_number, ayat_number)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorite_bookmarks_user_id ON favorite_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_bookmarks_folder ON favorite_bookmarks(user_id, folder_name);
CREATE INDEX IF NOT EXISTS idx_favorite_bookmarks_created_at ON favorite_bookmarks(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE favorite_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bookmarks" ON favorite_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" ON favorite_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks" ON favorite_bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON favorite_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_favorite_bookmarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER favorite_bookmarks_updated_at
  BEFORE UPDATE ON favorite_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_favorite_bookmarks_updated_at();
