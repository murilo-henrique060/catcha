create table public.exchanges (
  sender_id uuid not null references public.profiles on delete cascade,
  receiver_id uuid not null references public.profiles on delete cascade,

  sender_cat_id bigint not null references public.cats on delete cascade,
  receiver_cat_id bigint references public.cats on delete cascade,

  status varchar(10) not null default 'pending',

  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),

  primary key (sender_id, receiver_id, sender_cat_id)
);  