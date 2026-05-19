import type { Product } from '@/types';

const PLACEHOLDER = 'https://placehold.co/600x600/1A1A1A/2DA89D?text=Bijou';
const MAX_IMAGES = 3;

/** Jusqu'à 3 URLs d'images pour un produit (image principale + galerie). */
export function getProductImages(product: Pick<Product, 'image_url' | 'images'>): string[] {
  const fromArray = (product.images ?? []).filter((u): u is string => typeof u === 'string' && u.length > 0);
  if (fromArray.length > 0) {
    return fromArray.slice(0, MAX_IMAGES);
  }
  if (product.image_url) {
    return [product.image_url];
  }
  return [];
}

export function getPrimaryImageUrl(product: Pick<Product, 'image_url' | 'images'>): string {
  return getProductImages(product)[0] ?? '';
}

export function normalizeProductImages(urls: string[]): { image_url: string | null; images: string[] } {
  const cleaned = urls.map((u) => u.trim()).filter(Boolean).slice(0, MAX_IMAGES);
  return {
    image_url: cleaned[0] ?? null,
    images: cleaned,
  };
}

export { PLACEHOLDER, MAX_IMAGES };
