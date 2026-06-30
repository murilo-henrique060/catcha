-- Add submitter_id and approved to cats
ALTER TABLE public.cats 
ADD COLUMN submitter_id uuid references public.profiles(id) on delete set null,
ADD COLUMN approved boolean not null default true;

-- Function to grant cat card when approved becomes true
CREATE OR REPLACE FUNCTION public.give_cat_to_submitter()
RETURNS TRIGGER AS $$
BEGIN
  -- If the card is newly approved and has a submitter
  IF NEW.approved = true AND OLD.approved = false AND NEW.submitter_id IS NOT NULL THEN
    -- Insert into profiles_cats
    INSERT INTO public.profiles_cats (profile_id, cat_id, quantity)
    VALUES (NEW.submitter_id, NEW.id, 1)
    ON CONFLICT (profile_id, cat_id) 
    DO UPDATE SET quantity = profiles_cats.quantity + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function after update on cats
CREATE TRIGGER trigger_approve_cat
AFTER UPDATE ON public.cats
FOR EACH ROW
EXECUTE FUNCTION public.give_cat_to_submitter();

-- Policy to allow authenticated users to upload to cats bucket
create policy "Allow authenticated uploads to cats bucket"
on storage.objects for insert
to authenticated
with check (bucket_id = 'cats');
