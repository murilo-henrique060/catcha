create table public.friendships (
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status varchar(20) not null default 'pending', -- 'pending', 'accepted', 'declined'
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (sender_id, receiver_id)
);
