
-- Create user roles table for proper admin authentication
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'creator');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_roles.user_id = $1 LIMIT 1;
$$;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Enable RLS on wrappers_fdw_stats table
ALTER TABLE public.wrappers_fdw_stats ENABLE ROW LEVEL SECURITY;

-- Add admin-only policy for wrappers_fdw_stats
CREATE POLICY "Only admins can access fdw stats"
ON public.wrappers_fdw_stats
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update videos table policies to be more granular
DROP POLICY IF EXISTS "Allow admin operations" ON public.videos;
DROP POLICY IF EXISTS "Anyone can view videos" ON public.videos;

-- More specific video policies
CREATE POLICY "Anyone can view videos"
ON public.videos
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert videos"
ON public.videos
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update videos"
ON public.videos
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete videos"
ON public.videos
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update process-video edge function to require JWT
