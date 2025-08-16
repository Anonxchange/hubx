-- Create posts table for creator content
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  post_type VARCHAR(20) DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video')),
  media_url TEXT,
  thumbnail_url TEXT,
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'followers')),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create foreign key relationship with profiles table
ALTER TABLE posts
ADD CONSTRAINT posts_creator_id_fkey
FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Post likes are viewable by everyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Post comments are viewable by everyone" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);