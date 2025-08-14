
-- Create video_favorites table for favorites functionality
CREATE TABLE IF NOT EXISTS public.video_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_session TEXT NOT NULL, -- Using session ID for anonymous users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate favorites for same user/video combination
  UNIQUE(video_id, user_session)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_favorites_video_id ON public.video_favorites(video_id);
CREATE INDEX IF NOT EXISTS idx_video_favorites_user_session ON public.video_favorites(user_session);
CREATE INDEX IF NOT EXISTS idx_video_favorites_created_at ON public.video_favorites(created_at);

-- Enable RLS
ALTER TABLE public.video_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - allow public access since we use session IDs
CREATE POLICY "Anyone can view favorites" ON public.video_favorites
  FOR SELECT USING (true);

CREATE POLICY "Anyone can add favorites" ON public.video_favorites
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can remove favorites" ON public.video_favorites
  FOR DELETE USING (true);
