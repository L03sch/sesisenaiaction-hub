-- Migration: Create avatars storage bucket
-- Created: 2025-10-22
-- Description: Setup storage bucket for user profile avatars with RLS policies

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for avatars bucket

-- Policy: Public read access
DROP POLICY IF EXISTS "Avatares são públicos para leitura" ON storage.objects;
CREATE POLICY "Avatares são públicos para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload their own avatars
DROP POLICY IF EXISTS "Usuários podem fazer upload de seus avatares" ON storage.objects;
CREATE POLICY "Usuários podem fazer upload de seus avatares"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatars
DROP POLICY IF EXISTS "Usuários podem atualizar seus avatares" ON storage.objects;
CREATE POLICY "Usuários podem atualizar seus avatares"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatars
DROP POLICY IF EXISTS "Usuários podem deletar seus avatares" ON storage.objects;
CREATE POLICY "Usuários podem deletar seus avatares"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
