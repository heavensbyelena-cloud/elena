-- Matériaux produit (multi-sélection : acier inoxydable, alliage, époxy)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS materials text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN products.materials IS 'Slugs matériaux : acier-inoxydable, alliage, epoxy (cumulables).';
