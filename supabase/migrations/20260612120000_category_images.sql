-- Photos de catégories (overrides Cloudinary, fallback = public/categories/)
create table if not exists category_images (
  slug       text primary key,
  image_url  text not null,
  updated_at timestamptz not null default now()
);

comment on table category_images is 'URLs Cloudinary par slug de catégorie ; sans ligne = image par défaut dans public/categories/.';

alter table category_images enable row level security;

create policy "Public read category_images" on category_images
  for select using (true);

create policy "Admin manage category_images" on category_images
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.is_admin = true)
    )
  );
