create table public.cats (
  id bigint generated always as identity,
  
  name varchar(50) not null,
  rarity varchar(1) not null,
  image_path varchar(50) not null,
);

create table public.profiles_cats (
  profile_id uuid not null references public.profiles on delete cascade,
  cat_id bigint not null references public.cats on delete cascade,
  quantity integer default 0,

  primary key (profile_id, cat_id)
);