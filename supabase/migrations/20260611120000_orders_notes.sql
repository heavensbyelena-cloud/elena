-- Numéro de suivi / notes admin (expédition)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN public.orders.notes IS 'Numéro de suivi ou note admin (ex. lors du passage en expédiée)';
