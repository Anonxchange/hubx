
-- Create video_views table for tracking watch history
CREATE TABLE IF NOT EXISTS public.video_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  watch_duration INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate entries for same user/video combination
  UNIQUE(user_id, video_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON public.video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_watched_at ON public.video_views(watched_at);

-- Enable RLS
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own watch history" ON public.video_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch history" ON public.video_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch history" ON public.video_views
  FOR UPDATE USING (auth.uid() = user_id);
