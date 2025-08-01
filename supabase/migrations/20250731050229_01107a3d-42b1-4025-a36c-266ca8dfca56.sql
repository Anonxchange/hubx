-- Add premium field to videos table
ALTER TABLE public.videos 
ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance when filtering premium videos
CREATE INDEX idx_videos_is_premium ON public.videos(is_premium);