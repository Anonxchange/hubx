
-- Add like/dislike columns to videos table
ALTER TABLE public.videos 
ADD COLUMN likes INTEGER DEFAULT 0,
ADD COLUMN dislikes INTEGER DEFAULT 0;

-- Create a table to track user reactions (to prevent duplicate votes)
CREATE TABLE public.video_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_session TEXT NOT NULL, -- Using session ID instead of user ID for anonymous users
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_session)
);

-- Enable RLS for video_reactions
ALTER TABLE public.video_reactions ENABLE ROW LEVEL SECURITY;

-- Allow public access to video_reactions
CREATE POLICY "Anyone can view reactions" 
  ON public.video_reactions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can add reactions" 
  ON public.video_reactions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update reactions" 
  ON public.video_reactions 
  FOR UPDATE 
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_video_reactions_video_id ON public.video_reactions (video_id);
CREATE INDEX idx_video_reactions_session ON public.video_reactions (user_session);
