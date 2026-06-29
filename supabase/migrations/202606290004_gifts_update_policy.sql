create policy "Permitir atualizacao dos proprios presentes"
  on public.gifts for update
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
