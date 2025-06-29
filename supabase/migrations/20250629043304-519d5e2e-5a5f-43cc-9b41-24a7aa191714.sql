
-- Create a table for video comments
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow public access to comments (since guests can comment)
CREATE POLICY "Anyone can view comments" 
  ON public.comments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can add comments" 
  ON public.comments 
  FOR INSERT 
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_comments_video_id ON public.comments (video_id);
CREATE INDEX idx_comments_created_at ON public.comments (created_at DESC);
