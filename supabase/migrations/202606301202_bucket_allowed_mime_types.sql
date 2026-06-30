update storage.buckets
set allowed_mime_types = array['image/webp', 'image/png', 'image/jpeg']
where id = 'cats';
