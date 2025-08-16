
-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tip_paypal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tip_venmo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tip_cashapp TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tip_bitcoin TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tip_ethereum TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tip_description TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_cover_photo_url ON profiles(cover_photo_url);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Ensure posts table exists with correct structure
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(20) DEFAULT 'text',
  privacy VARCHAR(20) DEFAULT 'public',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT posts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
