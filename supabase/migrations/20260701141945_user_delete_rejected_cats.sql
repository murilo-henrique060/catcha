CREATE POLICY "Permitir deleção de gatos rejeitados pelo próprio usuário" ON public.cats
FOR DELETE
USING (
  auth.uid() = submitter_id AND status = 'rejected'
);
