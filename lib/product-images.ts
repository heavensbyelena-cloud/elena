import type { Product } from '@/types';

const PLACEHOLDER = 'https://placehold.co/600x600/1A1A1A/2DA89D?text=Bijou';
const MAX_IMAGES = 3;

/** Jusqu'à 3 URLs d'images pour un produit (image principale + galerie). */
function coerceImagesArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  }
  if (typeof raw === 'string' && raw.trim()) {
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) return coerceImagesArray(parsed);
      } catch {
        /* ignore */
      }
    }
  }
  return [];
}

export function getProductImages(product: Pick<Product, 'image_url' | 'images'>): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  const add = (url: string | null | undefined) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    urls.push(trimmed);
  };

  coerceImagesArray(product.images).forEach(add);
  add(product.image_url);

  return urls.slice(0, MAX_IMAGES);
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
