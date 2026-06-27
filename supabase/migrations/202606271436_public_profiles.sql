create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  username varchar(50) not null unique,
  
  money integer default 0,
  
  cards_drawn integer default 0,
  cards_traded integer default 0,
  cards_sold integer default 0,
  cards_bought integer default 0,

  next_draw timestamp with time zone default timezone('utc'::text, now()),

  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  
  primary key (id)
);