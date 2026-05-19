-- Galerie produit : jusqu'à 3 photos par article
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT NULL;

COMMENT ON COLUMN products.images IS 'URLs des photos (max 3). image_url = première photo.';
