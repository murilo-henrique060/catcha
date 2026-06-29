-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles_cats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 2. Define Policies

-- public.profiles
CREATE POLICY "Permitir leitura de perfis por qualquer usuário autenticado" 
  ON public.profiles FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Permitir inserção de perfil" 
  ON public.profiles FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Permitir atualização do próprio perfil" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- public.cats
CREATE POLICY "Permitir leitura de gatos por qualquer usuário autenticado" 
  ON public.cats FOR SELECT 
  TO authenticated 
  USING (true);

-- public.items
CREATE POLICY "Permitir leitura de itens por qualquer usuário autenticado" 
  ON public.items FOR SELECT 
  TO authenticated 
  USING (true);

-- public.profiles_cats
CREATE POLICY "Permitir leitura de coleções por qualquer usuário autenticado" 
  ON public.profiles_cats FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Permitir modificação da própria coleção" 
  ON public.profiles_cats FOR ALL 
  TO authenticated 
  USING (auth.uid() = profile_id);

-- public.profiles_items
CREATE POLICY "Permitir leitura dos próprios itens" 
  ON public.profiles_items FOR SELECT 
  TO authenticated 
  USING (auth.uid() = profile_id);

CREATE POLICY "Permitir modificação dos próprios itens" 
  ON public.profiles_items FOR ALL 
  TO authenticated 
  USING (auth.uid() = profile_id);

-- public.exchanges
CREATE POLICY "Permitir leitura das próprias trocas" 
  ON public.exchanges FOR SELECT 
  TO authenticated 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Permitir modificação das próprias trocas" 
  ON public.exchanges FOR ALL 
  TO authenticated 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- public.friendships
CREATE POLICY "Permitir leitura das próprias amizades" 
  ON public.friendships FOR SELECT 
  TO authenticated 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Permitir modificação das próprias amizades" 
  ON public.friendships FOR ALL 
  TO authenticated 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
