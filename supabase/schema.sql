-- ========================================================
-- Schema Setup for diagram-but
-- Run this in your Supabase SQL Editor if tables are not yet created
-- ========================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create app_users table for custom username + password auth
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on username for fast login lookups
CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users(username);

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    type TEXT,
    category TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT,
    user_id TEXT
);

-- Index on documents created_at and category/type for filtering
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON public.documents(created_by);

-- Enable RLS and permissive development policies
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development with custom auth
DROP POLICY IF EXISTS "Allow all access to app_users" ON public.app_users;
CREATE POLICY "Allow all access to app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
CREATE POLICY "Allow all access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to documents" ON public.documents;
CREATE POLICY "Allow all access to documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket setup for 'uploads'
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permissive storage policy for uploads
DROP POLICY IF EXISTS "Allow public read access on uploads" ON storage.objects;
CREATE POLICY "Allow public read access on uploads" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Allow public insert on uploads" ON storage.objects;
CREATE POLICY "Allow public insert on uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Allow public delete on uploads" ON storage.objects;
CREATE POLICY "Allow public delete on uploads" ON storage.objects
FOR DELETE USING (bucket_id = 'uploads');
