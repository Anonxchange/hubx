
-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  preview_url TEXT,
  duration TEXT DEFAULT '0:00',
  views INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (no authentication required)
CREATE POLICY "Anyone can view videos" 
  ON public.videos 
  FOR SELECT 
  USING (true);

-- Create policy to allow insert/update/delete (for admin operations)
CREATE POLICY "Allow admin operations" 
  ON public.videos 
  FOR ALL 
  USING (true);

-- Create an index on tags for better performance
CREATE INDEX idx_videos_tags ON public.videos USING GIN (tags);

-- Create an index on created_at for sorting
CREATE INDEX idx_videos_created_at ON public.videos (created_at DESC);
