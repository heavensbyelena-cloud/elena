-- Renommer la catégorie technique : resine → decoration
-- et les sous-catégories resine-* → decoration-*
-- À exécuter sur Supabase (SQL Editor) avant ou en même temps que le déploiement du code mis à jour.

BEGIN;

-- Vérification optionnelle :
-- SELECT category, COUNT(*) FROM products WHERE category = 'resine' OR category LIKE 'resine-%' GROUP BY category;

UPDATE public.products
SET
  category = 'decoration',
  updated_at = NOW()
WHERE category = 'resine';

UPDATE public.products
SET
  category = 'decoration-' || regexp_replace(category, '^resine-', ''),
  updated_at = NOW()
WHERE category LIKE 'resine-%';

COMMIT;
