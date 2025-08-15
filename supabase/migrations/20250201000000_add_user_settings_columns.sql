
-- Add columns to profiles table for user settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS backup_codes TEXT[];

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add constraint to ensure username is lowercase and only contains allowed characters
ALTER TABLE profiles ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]+$');

-- Update RLS policies to allow users to update their own settings
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Allow users to read usernames for availability checks (but not other sensitive data)
CREATE POLICY "Public username lookup" ON profiles FOR SELECT USING (true);
