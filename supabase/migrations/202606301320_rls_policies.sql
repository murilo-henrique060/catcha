-- Fix storage.objects policy to require owner = auth.uid()
DROP POLICY IF EXISTS "Allow authenticated uploads to cats bucket" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to cats bucket" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'cats' AND auth.uid() = owner);

-- Add INSERT policy for public.cats table
CREATE POLICY "Permitir inserção de gatos submetidos pelo próprio usuário"
ON public.cats FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = submitter_id AND 
  approved = false
);
