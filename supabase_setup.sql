-- 1. Update users table and set up RLS
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Ensure existing users with NULL credits get the default
UPDATE public.users SET credits = 300 WHERE credits IS NULL;
UPDATE public.users SET subscription_tier = 'free' WHERE subscription_tier IS NULL;

-- Set up Row Level Security (RLS) for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Policy: Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);


-- 2. Create models table to store AI Influencers
CREATE TABLE IF NOT EXISTS public.models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT,
    body_type TEXT,
    skin_tone TEXT,
    age_range TEXT,
    hair_style TEXT,
    hair_color TEXT,
    eye_color TEXT,
    vibe TEXT,
    prompt TEXT,
    portrait_url TEXT,
    full_body_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Set up Row Level Security (RLS) for models
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own models
CREATE POLICY "Users can view their own models" 
ON public.models 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own models
CREATE POLICY "Users can insert their own models" 
ON public.models 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own models
CREATE POLICY "Users can update their own models" 
ON public.models 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can only delete their own models
CREATE POLICY "Users can delete their own models" 
ON public.models 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Create posts table to store generated content
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    model_id UUID REFERENCES public.models(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_url TEXT,
    aspect_ratio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up RLS for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own posts" 
ON public.posts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Storage Setup for Influencer Images
-- Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('influencers', 'influencers', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public access to images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'influencers');

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'influencers' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update/delete their own images
CREATE POLICY "Users can update their own images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'influencers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'influencers' AND auth.uid()::text = (storage.foldername(name))[1]);


-- 6. Create social_accounts table to store connected profiles
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    profile_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, platform, account_id)
);

-- Enable RLS for social_accounts
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for social_accounts
DROP POLICY IF EXISTS "Users can view their own social accounts" ON public.social_accounts;
CREATE POLICY "Users can view their own social accounts" 
ON public.social_accounts FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own social accounts" ON public.social_accounts;
CREATE POLICY "Users can insert their own social accounts" 
ON public.social_accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own social accounts" ON public.social_accounts;
CREATE POLICY "Users can delete their own social accounts" 
ON public.social_accounts FOR DELETE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own social accounts" ON public.social_accounts;
CREATE POLICY "Users can update their own social accounts" 
ON public.social_accounts FOR UPDATE 
USING (auth.uid() = user_id);


