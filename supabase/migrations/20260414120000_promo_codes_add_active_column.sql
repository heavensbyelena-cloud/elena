-- La table promo_codes peut exister sans cette colonne si une ancienne version
-- a été appliquée manuellement. PostgREST exige que la colonne existe pour les requêtes.
alter table public.promo_codes
  add column if not exists active boolean default true;
