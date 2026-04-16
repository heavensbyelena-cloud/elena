create table promo_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  type          text check (type in ('percent')) not null default 'percent',
  value         numeric not null check (value > 0 and value <= 100),
  min_order     numeric default null,
  max_uses      int default null,
  uses_count    int default 0,
  is_personal   boolean default false,
  expires_at    timestamptz default null,
  active        boolean default true,
  created_at    timestamptz default now()
);

create table promo_code_users (
  id              uuid primary key default gen_random_uuid(),
  promo_code_id   uuid references promo_codes(id) on delete cascade,
  user_id         uuid references profiles(id) on delete cascade,
  max_uses        int not null default 1,
  uses_count      int default 0,
  unique(promo_code_id, user_id)
);

create table promo_code_usages (
  id              uuid primary key default gen_random_uuid(),
  promo_code_id   uuid references promo_codes(id) on delete cascade,
  user_id         uuid references profiles(id) on delete cascade,
  order_id        uuid default null,
  used_at         timestamptz default now()
);

create index promo_codes_code_idx on promo_codes (lower(code));
create index promo_code_usages_user_idx on promo_code_usages (user_id, promo_code_id);

alter table promo_codes enable row level security;
alter table promo_code_users enable row level security;
alter table promo_code_usages enable row level security;

create policy "Admin full access promo_codes" on promo_codes for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admin full access promo_code_users" on promo_code_users for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admin full access promo_code_usages" on promo_code_usages for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Users read own usages" on promo_code_usages for select
  using (auth.uid() = user_id);
