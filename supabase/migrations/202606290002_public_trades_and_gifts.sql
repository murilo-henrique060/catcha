drop table if exists public.exchanges cascade;

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  cat_id bigint not null references public.cats(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  sender_cat_id bigint not null references public.cats(id) on delete cascade,
  receiver_cat_id bigint references public.cats(id) on delete cascade,
  status varchar(20) not null default 'pending', -- 'pending', 'countered', 'accepted', 'rejected', 'cancelled'
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.gifts enable row level security;
alter table public.trades enable row level security;

-- Policies for gifts
create policy "Permitir leitura dos proprios presentes"
  on public.gifts for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Permitir insercao de presentes"
  on public.gifts for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- Policies for trades
create policy "Permitir leitura das proprias trocas"
  on public.trades for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Permitir insercao de trocas"
  on public.trades for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy "Permitir atualizacao das proprias trocas"
  on public.trades for update
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
