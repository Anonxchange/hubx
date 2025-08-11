
-- Create video_views table to track user video views
CREATE TABLE IF NOT EXISTS video_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewed_at ON video_views(viewed_at);

-- Add created_by column to videos table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'created_by') THEN
        ALTER TABLE videos ADD COLUMN created_by UUID;
    END IF;
END $$;

-- Create index for created_by column
CREATE INDEX IF NOT EXISTS idx_videos_created_by ON videos(created_by);

-- Enable Row Level Security
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- Create policy for video_views (users can only see their own views)
CREATE POLICY "Users can view their own video views" ON video_views
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own video views" ON video_views
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
