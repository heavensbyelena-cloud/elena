-- Colonnes commande : code promo et montant de remise
alter table public.orders
  add column if not exists promo_code_id uuid references public.promo_codes(id) on delete set null;

alter table public.orders
  add column if not exists discount_amount numeric not null default 0;
