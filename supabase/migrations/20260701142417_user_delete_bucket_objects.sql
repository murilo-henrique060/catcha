CREATE POLICY "Allow owners to delete from cats bucket" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cats' AND auth.uid() = owner
);
