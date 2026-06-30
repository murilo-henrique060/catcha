-- Create cats bucket if not exists
insert into storage.buckets (id, name, public)
values ('cats', 'cats', true)
on conflict (id) do nothing;

-- Drop policy if it exists to avoid conflicts during reset
drop policy if exists "Allow public read access for cats bucket" on storage.objects;

-- Create policy to allow public read access (select) on the cats bucket
create policy "Allow public read access for cats bucket"
on storage.objects for select
using (bucket_id = 'cats');

-- Safely clean up the existing image paths by removing the '/cats/' prefix if present
update public.cats
set image_path = replace(image_path, '/cats/', '')
where image_path like '/cats/%';
