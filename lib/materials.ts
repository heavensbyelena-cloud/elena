import type { Product, ProductMaterial } from '@/types';

export const PRODUCT_MATERIALS: { slug: ProductMaterial; label: string }[] = [
  { slug: 'acier-inoxydable', label: 'Acier inoxydable' },
  { slug: 'alliage', label: 'Alliage' },
  { slug: 'epoxy', label: 'Époxy' },
  { slug: 'pate-polymere', label: 'Pâte polymère' },
];

const VALID_SLUGS = new Set<ProductMaterial>(PRODUCT_MATERIALS.map((m) => m.slug));

export function getMaterialLabel(slug: ProductMaterial): string {
  return PRODUCT_MATERIALS.find((m) => m.slug === slug)?.label ?? slug;
}

export function formatMaterialsList(materials?: ProductMaterial[] | null): string {
  if (!materials?.length) return '';
  return materials.map(getMaterialLabel).join(' · ');
}

/** Garde uniquement les slugs valides, sans doublons. */
export function normalizeMaterialsInput(raw: unknown): ProductMaterial[] {
  if (!Array.isArray(raw)) return [];
  const out: ProductMaterial[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const slug = item as ProductMaterial;
    if (VALID_SLUGS.has(slug) && !out.includes(slug)) out.push(slug);
  }
  return out;
}

/** Filtre OR : le produit s'affiche si au moins un matériau sélectionné correspond. */
export function productMatchesMaterials(
  product: Pick<Product, 'materials'>,
  selected: ProductMaterial[]
): boolean {
  if (selected.length === 0) return true;
  const raw = product.materials;
  const productMaterials = Array.isArray(raw) ? raw : [];
  return selected.some((m) => productMaterials.includes(m));
}
