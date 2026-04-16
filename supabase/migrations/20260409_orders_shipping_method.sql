-- Ajout des colonnes pour gérer les modes de livraison (domicile vs point relay)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method TEXT CHECK (shipping_method IN ('home_delivery', 'point_relay')) DEFAULT 'home_delivery',
  ADD COLUMN IF NOT EXISTS pickup_point JSONB,
  ADD COLUMN IF NOT EXISTS shipping_address_home JSONB;

-- Commentaires
COMMENT ON COLUMN orders.shipping_method IS 'Mode de livraison : home_delivery ou point_relay';
COMMENT ON COLUMN orders.pickup_point    IS 'Données du point Mondial Relay : {id, name, address, city, zipCode}';
COMMENT ON COLUMN orders.shipping_address_home IS 'Adresse domicile complète (si home_delivery)';
