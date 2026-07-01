ALTER TABLE public.cats ADD COLUMN status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.cats ADD COLUMN reject_message text;

-- Migrate data
UPDATE public.cats SET status = 'approved' WHERE approved = true;
UPDATE public.cats SET status = 'pending' WHERE approved = false;

-- Add check constraint for status
ALTER TABLE public.cats ADD CONSTRAINT cats_status_check CHECK (status IN ('pending', 'approved', 'rejected'));

-- Drop the dependent policy
DROP POLICY IF EXISTS "Permitir inserção de gatos submetidos pelo próprio usuário" ON public.cats;

-- Drop old boolean column
ALTER TABLE public.cats DROP COLUMN approved;

-- Recreate the policy with status
CREATE POLICY "Permitir inserção de gatos submetidos pelo próprio usuário"
ON public.cats FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = submitter_id AND 
  status = 'pending'
);

-- Update the function trigger
CREATE OR REPLACE FUNCTION public.give_cat_to_submitter()
RETURNS TRIGGER AS $$
BEGIN
  -- If the card is newly approved and has a submitter
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.submitter_id IS NOT NULL THEN
    -- Insert into profiles_cats
    INSERT INTO public.profiles_cats (profile_id, cat_id, quantity)
    VALUES (NEW.submitter_id, NEW.id, 1)
    ON CONFLICT (profile_id, cat_id) 
    DO UPDATE SET quantity = profiles_cats.quantity + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
