create table public.items (
  id bigint generated always as identity,
  
  name varchar(50) not null,
  type varchar(10) not null,
  description text not null,
  image_url varchar(50) not null,
  price integer not null,

  primary key (id)
);

create table public.profiles_items (
  profile_id uuid not null references public.profiles on delete cascade,
  item_id bigint not null references public.items on delete cascade,
  quantity integer default 0,

  primary key (profile_id, item_id)
);