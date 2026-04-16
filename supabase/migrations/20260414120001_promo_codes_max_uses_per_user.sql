-- Utilisé pour les codes non personnels : limite d'utilisations par client (voir validate/route).
alter table public.promo_codes
  add column if not exists max_uses_per_user int default 1;
